import { FINAL_OUTPUTS_TABLE, SUPABASE_FINAL_IMAGES_BUCKET, supabase } from '../lib/supabase'
import { createThumbnailBlob, dataUrlToBlob, resizeImageBlob } from '../utils/imageOptimization'

const sanitizePathSegment = (value) => String(value || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '-')

export const normalizeFinalOutput = (output) => ({
  id: output.id,
  eventId: output.event_id || output.eventId,
  sessionId: output.session_id || output.sessionId,
  imagePath: output.image_path || output.imagePath,
  thumbnailPath: output.thumbnail_path || output.thumbnailPath,
  imageUrl: output.image_url || output.imageUrl || output.public_url || output.publicUrl,
  thumbnailUrl: output.thumbnail_url || output.thumbnailUrl,
  fileSize: output.file_size || output.fileSize,
  thumbnailSize: output.thumbnail_size || output.thumbnailSize,
  mimeType: output.mime_type || output.mimeType,
  width: output.width,
  height: output.height,
  uploadStatus: output.upload_status || output.uploadStatus || 'success',
  createdAt: output.created_at || output.createdAt,
})

export const getFinalOutputs = async (eventId) => {
  const query = eventId ? supabase.from(FINAL_OUTPUTS_TABLE).selectByEventId(eventId) : supabase.from(FINAL_OUTPUTS_TABLE).selectAll()
  const { data } = await query
  return Array.isArray(data) ? data.map(normalizeFinalOutput) : []
}

const getWebPExtension = (blob) => (blob?.type === 'image/webp' ? 'webp' : 'bin')

const uploadBlobToStorage = async ({ path, blob }) => {
  await supabase.storage.from(SUPABASE_FINAL_IMAGES_BUCKET).upload(path, blob, {
    contentType: blob.type || 'application/octet-stream',
    upsert: true,
  })
  const { data } = supabase.storage.from(SUPABASE_FINAL_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export const uploadFinalOutputToSupabase = async (queueItem) => {
  let finalBlob = queueItem.finalBlob
  let thumbnailBlob = queueItem.thumbnailBlob
  let width = queueItem.width
  let height = queueItem.height

  if (!finalBlob && queueItem.imageDataUrl) {
    const sourceBlob = await dataUrlToBlob(queueItem.imageDataUrl)
    const optimizedFinal = await resizeImageBlob(sourceBlob, { maxWidth: 1800, maxHeight: 2700, quality: 0.85, type: 'image/webp' })
    const optimizedThumbnail = await createThumbnailBlob(optimizedFinal.blob, { maxWidth: 400, quality: 0.75, type: 'image/webp' })
    finalBlob = optimizedFinal.blob
    thumbnailBlob = optimizedThumbnail.blob
    width = optimizedFinal.width
    height = optimizedFinal.height
  }

  let remoteImageUrl = queueItem.remoteImageUrl || ''
  let remoteThumbnailUrl = queueItem.remoteThumbnailUrl || ''
  const finalPath = queueItem.finalStoragePath || [
    sanitizePathSegment(queueItem.eventId),
    `${sanitizePathSegment(queueItem.localOutputId)}.${getWebPExtension(finalBlob)}`,
  ].join('/')
  const thumbnailPath = queueItem.thumbnailStoragePath || [
    sanitizePathSegment(queueItem.eventId),
    'thumbnails',
    `${sanitizePathSegment(queueItem.localOutputId)}.${getWebPExtension(thumbnailBlob)}`,
  ].join('/')

  try {
    if (!remoteImageUrl) {
      remoteImageUrl = await uploadBlobToStorage({ path: finalPath, blob: finalBlob })
    }

    if (!remoteThumbnailUrl) {
      remoteThumbnailUrl = await uploadBlobToStorage({ path: thumbnailPath, blob: thumbnailBlob })
    }
  } catch (error) {
    error.remoteImageUrl = remoteImageUrl
    error.remoteThumbnailUrl = remoteThumbnailUrl
    error.finalStoragePath = finalPath
    error.thumbnailStoragePath = thumbnailPath
    throw error
  }

  const metadata = {
    id: queueItem.localOutputId,
    event_id: queueItem.eventId,
    session_id: queueItem.sessionId,
    image_path: finalPath,
    thumbnail_path: thumbnailPath,
    image_url: remoteImageUrl,
    thumbnail_url: remoteThumbnailUrl,
    file_size: queueItem.finalSize || finalBlob?.size,
    thumbnail_size: queueItem.thumbnailSize || thumbnailBlob?.size,
    mime_type: queueItem.mimeType || finalBlob?.type || 'image/webp',
    width,
    height,
    upload_status: 'success',
    created_at: queueItem.createdAt,
  }
  const { data } = await supabase.from(FINAL_OUTPUTS_TABLE).upsert(metadata)
  return normalizeFinalOutput(Array.isArray(data) ? data[0] : metadata)
}
