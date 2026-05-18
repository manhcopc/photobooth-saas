import { FINAL_OUTPUTS_TABLE, SUPABASE_FINAL_IMAGES_BUCKET, supabase } from '../lib/supabase'

const DATA_URL_PATTERN = /^data:(?<mime>[-\w.]+\/[-\w+.]+);base64,(?<data>.*)$/
const DECODE_CHUNK_SIZE = 1024 * 128

const getExtension = (mimeType) => {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/webp') return 'webp'
  return 'png'
}

const sanitizePathSegment = (value) => String(value || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '-')

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

export const normalizeFinalOutput = (output) => ({
  id: output.id,
  eventId: output.event_id || output.eventId,
  sessionId: output.session_id || output.sessionId,
  imagePath: output.image_path || output.imagePath,
  imageUrl: output.image_url || output.imageUrl || output.public_url || output.publicUrl,
  uploadStatus: output.upload_status || output.uploadStatus || 'success',
  createdAt: output.created_at || output.createdAt,
})

export const getFinalOutputs = async (eventId) => {
  const query = eventId ? supabase.from(FINAL_OUTPUTS_TABLE).selectByEventId(eventId) : supabase.from(FINAL_OUTPUTS_TABLE).selectAll()
  const { data } = await query
  return Array.isArray(data) ? data.map(normalizeFinalOutput) : []
}

export const uploadFinalOutputToSupabase = async (queueItem) => {
  const blob = dataUrlToBlob(queueItem.imageDataUrl)
  const extension = getExtension(blob.type)
  const storagePath = queueItem.storagePath || [
    sanitizePathSegment(queueItem.eventId),
    sanitizePathSegment(queueItem.sessionId),
    `${sanitizePathSegment(queueItem.localOutputId)}.${extension}`,
  ].join('/')

  await supabase.storage.from(SUPABASE_FINAL_IMAGES_BUCKET).upload(storagePath, blob, {
    contentType: blob.type,
    upsert: true,
  })

  const { data: publicUrlData } = supabase.storage.from(SUPABASE_FINAL_IMAGES_BUCKET).getPublicUrl(storagePath)
  const metadata = {
    id: queueItem.localOutputId,
    event_id: queueItem.eventId,
    session_id: queueItem.sessionId,
    image_path: storagePath,
    image_url: publicUrlData.publicUrl,
    upload_status: 'success',
    created_at: queueItem.createdAt,
  }
  const { data } = await supabase.from(FINAL_OUTPUTS_TABLE).upsert(metadata)
  return normalizeFinalOutput(Array.isArray(data) ? data[0] : metadata)
}
