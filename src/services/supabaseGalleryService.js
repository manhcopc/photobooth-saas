import { FINAL_OUTPUTS_TABLE, supabase } from '../lib/supabase'
import { UPLOAD_QUEUE_STATUSES } from './uploadQueueService'

export const mapCloudOutputToGalleryItem = (output) => ({
  id: output.id,
  eventId: output.event_id || output.eventId,
  sessionId: output.session_id || output.sessionId,
  thumbnailUrl: output.thumbnail_url || output.thumbnailUrl || output.image_url || output.imageUrl,
  imageUrl: output.image_url || output.imageUrl,
  downloadUrl: output.image_url || output.imageUrl,
  remoteImageUrl: output.image_url || output.imageUrl,
  remoteThumbnailUrl: output.thumbnail_url || output.thumbnailUrl,
  syncStatus: UPLOAD_QUEUE_STATUSES.success,
  status: UPLOAD_QUEUE_STATUSES.success,
  source: 'cloud',
  createdAt: output.created_at || output.createdAt,
  fileSize: output.file_size || output.fileSize,
  thumbnailSize: output.thumbnail_size || output.thumbnailSize,
  mimeType: output.mime_type || output.mimeType,
  width: output.width,
  height: output.height,
  downloadCount: output.download_count || output.downloadCount || 0,
  frameName: output.frame_name || output.frameName || 'Khung mặc định',
  renderMode: output.frame_render_mode || output.frameRenderMode || output.render_mode || output.renderMode || 'overlay_only',
})

export const getCloudFinalOutputsByEventId = async (eventId) => {
  const { data } = await supabase.from(FINAL_OUTPUTS_TABLE).selectByEventId(eventId, 'id,event_id,session_id,image_url,thumbnail_url,file_size,thumbnail_size,mime_type,width,height,created_at,download_count,frame_name,frame_render_mode')
  return Array.isArray(data) ? data.map(mapCloudOutputToGalleryItem) : []
}

export const incrementDownloadCount = async (outputId, currentCount = 0) => {
  try {
    await supabase.from(FINAL_OUTPUTS_TABLE).updateById(outputId, { download_count: currentCount + 1 })
  } catch {
    // Optional analytics field. Ignore failures so downloads never break gallery UX.
  }
}
