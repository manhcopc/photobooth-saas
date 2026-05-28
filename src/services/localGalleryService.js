import { getLocalFinalOutputs, getUploadQueue, UPLOAD_QUEUE_STATUSES } from './uploadQueueService'

const getLocalPreviewUrl = (blob) => (blob ? URL.createObjectURL(blob) : '')

export const mapLocalOutputToGalleryItem = (output, queueItem) => {
  const status = queueItem?.status || output.syncStatus || output.status || UPLOAD_QUEUE_STATUSES.pending
  const remoteImageUrl = queueItem?.remoteImageUrl || output.remoteImageUrl
  const remoteThumbnailUrl = queueItem?.remoteThumbnailUrl || output.remoteThumbnailUrl
  const localThumbnailUrl = getLocalPreviewUrl(output.thumbnailBlob)
  const localImageUrl = getLocalPreviewUrl(output.finalBlob)
  const thumbnailUrl = remoteThumbnailUrl || localThumbnailUrl || remoteImageUrl || localImageUrl || output.thumbnailDataUrl || output.finalDataUrl || output.imageDataUrl
  const imageUrl = remoteImageUrl || localImageUrl || output.finalDataUrl || output.imageDataUrl || thumbnailUrl

  return {
    id: output.id,
    eventId: output.eventId,
    sessionId: output.sessionId,
    thumbnailUrl,
    imageUrl,
    downloadUrl: imageUrl,
    localImageUrl,
    localThumbnailUrl,
    remoteImageUrl,
    remoteThumbnailUrl,
    syncStatus: status,
    status,
    source: 'local',
    queueItemId: output.queueItemId,
    errorMessage: queueItem?.errorMessage || output.errorMessage,
    createdAt: output.createdAt,
    fileSize: output.finalSize,
    thumbnailSize: output.thumbnailSize,
    mimeType: output.mimeType,
    width: output.width,
    height: output.height,
  }
}

export const getLocalGalleryItemsByEventId = async (eventId) => {
  const [outputs, queueItems] = await Promise.all([getLocalFinalOutputs(eventId), getUploadQueue(eventId)])
  const queueByLocalOutputId = new Map(queueItems.map((item) => [item.localOutputId, item]))
  return outputs
    .map((output) => mapLocalOutputToGalleryItem(output, queueByLocalOutputId.get(output.id)))
    .filter((item) => item.thumbnailUrl || item.imageUrl)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export const revokeLocalGalleryItemUrls = (items) => {
  items.forEach((item) => {
    if (item.localThumbnailUrl?.startsWith('blob:')) URL.revokeObjectURL(item.localThumbnailUrl)
    if (item.localImageUrl?.startsWith('blob:')) URL.revokeObjectURL(item.localImageUrl)
  })
}
