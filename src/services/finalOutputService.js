import { FINAL_OUTPUTS_TABLE, SUPABASE_FINAL_IMAGES_BUCKET, supabase } from '../lib/supabase'
import { STORAGE_KEYS } from '../store/keys'
import { readStorage, writeStorage } from '../utils/storage'

const DATA_URL_PATTERN = /^data:(?<mime>[-\w.]+\/[-\w+.]+);base64,(?<data>.*)$/
const DECODE_CHUNK_SIZE = 1024 * 128

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const getExtension = (mimeType) => {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/webp') return 'webp'
  return 'png'
}

const sanitizePathSegment = (value) => String(value || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '-')

const getQueue = async () => {
  const queue = await readStorage(STORAGE_KEYS.finalUploadQueue, [])
  return Array.isArray(queue) ? queue : []
}

const saveQueue = async (queue) => writeStorage(STORAGE_KEYS.finalUploadQueue, queue)

const upsertQueuedOutput = async (queuedOutput) => {
  const queue = await getQueue()
  const existingIndex = queue.findIndex((item) => item.id === queuedOutput.id)
  const nextQueue = existingIndex >= 0 ? queue.map((item) => (item.id === queuedOutput.id ? queuedOutput : item)) : [queuedOutput, ...queue]
  await saveQueue(nextQueue)
  return queuedOutput
}

const removeQueuedOutput = async (id) => {
  const queue = await getQueue()
  await saveQueue(queue.filter((item) => item.id !== id))
}

export const dataUrlToBlob = (dataUrl) => {
  const match = dataUrl.match(DATA_URL_PATTERN)
  if (!match?.groups) throw new Error('Final image không đúng định dạng dataURL.')

  const mimeType = match.groups.mime
  const base64 = match.groups.data
  const byteCharacters = window.atob(base64)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += DECODE_CHUNK_SIZE) {
    const slice = byteCharacters.slice(offset, offset + DECODE_CHUNK_SIZE)
    const byteNumbers = new Array(slice.length)
    for (let index = 0; index < slice.length; index += 1) {
      byteNumbers[index] = slice.charCodeAt(index)
    }
    byteArrays.push(new Uint8Array(byteNumbers))
  }

  return new Blob(byteArrays, { type: mimeType })
}

const normalizeOutput = (output) => ({
  id: output.id,
  eventId: output.event_id || output.eventId,
  sessionId: output.session_id || output.sessionId,
  imagePath: output.image_path || output.imagePath,
  imageUrl: output.image_url || output.imageUrl || output.public_url || output.publicUrl,
  uploadStatus: output.upload_status || output.uploadStatus || 'success',
  createdAt: output.created_at || output.createdAt,
})

export const getQueuedFinalOutputs = async (eventId) => {
  const queue = await getQueue()
  return eventId ? queue.filter((item) => item.eventId === eventId) : queue
}

export const getFinalOutputs = async (eventId) => {
  const query = eventId ? supabase.from(FINAL_OUTPUTS_TABLE).selectByEventId(eventId) : supabase.from(FINAL_OUTPUTS_TABLE).selectAll()
  const { data } = await query
  return Array.isArray(data) ? data.map(normalizeOutput) : []
}

const uploadQueuedOutput = async (queuedOutput) => {
  const uploadingOutput = {
    ...queuedOutput,
    status: 'uploading',
    error: '',
    updatedAt: new Date().toISOString(),
  }
  await upsertQueuedOutput(uploadingOutput)

  try {
    const blob = dataUrlToBlob(uploadingOutput.dataUrl)
    const extension = getExtension(blob.type)
    const storagePath = uploadingOutput.storagePath || [
      sanitizePathSegment(uploadingOutput.eventId),
      sanitizePathSegment(uploadingOutput.sessionId),
      `${sanitizePathSegment(uploadingOutput.id)}.${extension}`,
    ].join('/')

    await supabase.storage.from(SUPABASE_FINAL_IMAGES_BUCKET).upload(storagePath, blob, {
      contentType: blob.type,
      upsert: true,
    })

    const { data: publicUrlData } = supabase.storage.from(SUPABASE_FINAL_IMAGES_BUCKET).getPublicUrl(storagePath)
    const metadata = {
      id: uploadingOutput.id,
      event_id: uploadingOutput.eventId,
      session_id: uploadingOutput.sessionId,
      image_path: storagePath,
      image_url: publicUrlData.publicUrl,
      upload_status: 'success',
      created_at: uploadingOutput.createdAt,
    }
    const { data } = await supabase.from(FINAL_OUTPUTS_TABLE).insert(metadata)
    await removeQueuedOutput(uploadingOutput.id)

    return {
      status: 'success',
      output: normalizeOutput(Array.isArray(data) ? data[0] : metadata),
    }
  } catch (error) {
    const failedOutput = {
      ...uploadingOutput,
      status: 'failed',
      error: error.message || 'Upload thất bại.',
      updatedAt: new Date().toISOString(),
    }
    await upsertQueuedOutput(failedOutput)
    return { status: 'failed', queuedOutput: failedOutput, error }
  }
}

export const uploadFinalOutput = async ({ event, sessionId, dataUrl }) => {
  const createdAt = new Date().toISOString()
  const queuedOutput = {
    id: createId('final'),
    eventId: event.id,
    eventSlug: event.slug,
    sessionId,
    dataUrl,
    status: 'uploading',
    error: '',
    createdAt,
    updatedAt: createdAt,
  }
  await upsertQueuedOutput(queuedOutput)
  return uploadQueuedOutput(queuedOutput)
}

export const retryQueuedFinalOutput = async (id) => {
  const queue = await getQueue()
  const queuedOutput = queue.find((item) => item.id === id)
  if (!queuedOutput) throw new Error('Không tìm thấy ảnh trong queue để upload lại.')
  return uploadQueuedOutput(queuedOutput)
}
