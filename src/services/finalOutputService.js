import { FINAL_OUTPUTS_TABLE, supabase } from '../lib/supabase'
// import { isUuid } from './eventFrameService'
import { createThumbnailBlob, dataUrlToBlob, resizeImageBlob } from '../utils/imageOptimization'
import { debugFetch as fetch } from '../utils/debugFetch'

// const sanitizePathSegment = (value) => String(value || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '-')

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
  frameId: output.frame_id || output.frameId || null,
  frameName: output.frame_name || output.frameName || 'Khung mặc định',
  renderMode: output.frame_render_mode || output.frameRenderMode || output.render_mode || output.renderMode || 'overlay_only',
})

export const getFinalOutputs = async (eventId) => {
  const query = eventId ? supabase.from(FINAL_OUTPUTS_TABLE).selectByEventId(eventId) : supabase.from(FINAL_OUTPUTS_TABLE).selectAll()
  const { data } = await query
  return Array.isArray(data) ? data.map(normalizeFinalOutput) : []
}

// const getWebPExtension = (blob) => (blob?.type === 'image/webp' ? 'webp' : 'bin')

import { getCaptures, getVideoClips, getSignature, getMessage, getSelectedPhotos } from './photoStorage'

export const uploadFinalOutputToBackend = async (queueItem) => {
  const { eventId, sessionId, finalBlob, localOutputId } = queueItem
  
  // Get all related media from storage
  const [photos, videoClips, signature, message, selectedPhotos] = await Promise.all([
    getCaptures({ eventId, sessionId }),
    getVideoClips({ eventId, sessionId }),
    getSignature({ eventId, sessionId }),
    getMessage({ eventId, sessionId }),
    getSelectedPhotos({ eventId, sessionId })
  ])

  const selectedIndices = photos.map((photo, index) => 
    selectedPhotos.some(s => s.id === photo.id) ? index : -1
  ).filter(i => i !== -1)

  const finalPhotosToUpload = selectedIndices.map(i => photos[i]).filter(Boolean)
  const finalVideosToUpload = selectedIndices.map(i => videoClips[i]).filter(Boolean)

  const formData = new FormData()
  formData.append('eventId', eventId)
  formData.append('sessionId', sessionId)
  formData.append('localOutputId', localOutputId)
  formData.append('isMirrored', 'true')
  if (queueItem.selectedFrameId) {
    formData.append('selectedFrameId', queueItem.selectedFrameId)
  }
  if (queueItem.selectedFrameName) {
    formData.append('selectedFrameName', queueItem.selectedFrameName)
  }
  if (queueItem.selectedFrameRenderMode) {
    formData.append('selectedFrameRenderMode', queueItem.selectedFrameRenderMode)
  }
  
  if (message) {
    formData.append('message', message)
  }

  if (finalBlob) {
    formData.append('finalImage', finalBlob, `final-${localOutputId}.webp`)
  }

  if (queueItem.composedVideoBlob) {
    formData.append('finalVideo', queueItem.composedVideoBlob, `final-${localOutputId}.webm`)
  }

  // Append raw photos
  finalPhotosToUpload.forEach((photo, index) => {
    if (photo && photo.blob) {
      formData.append('photos', photo.blob, `photo-${index}.webp`)
    }
  })

  // Append video clips
  finalVideosToUpload.forEach((video, index) => {
    if (video) {
      formData.append('videoClips', video, `video-${index}.webm`)
    }
  })

  // Append signature
  if (signature) {
    try {
      const sigBlob = await dataUrlToBlob(signature)
      formData.append('signature', sigBlob, 'signature.png')
    } catch (e) {
      console.error('Failed to convert signature to blob', e)
    }
  }

  // const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const apiUrl = import.meta.env.VITE_API_URL
  const response = await fetch(`${apiUrl}/api/sessions/saas-upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }

  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Backend upload failed')
  }

  // The backend already saves to the final_outputs table via TypeORM!
  // So we just need to return the expected object format so the queue marks it as success.
  return {
    imageUrl: data.finalImageUrl,
    thumbnailUrl: data.finalImageUrl, // We can use the same or let backend generate
  }
}
