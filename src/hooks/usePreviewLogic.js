import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentEvent } from './useCurrentEvent'
import { composeFinalCanvas } from '../utils/canvas'
import { composeFinalVideo } from '../utils/video'
import { optimizeFinalCanvas } from '../utils/imageOptimization'
import { getActiveSession, getSelectedFrame, getSelectedPhotos, saveCameraSettings, saveSelectedFrame, saveSignature, saveMessage, getVideoClips } from '../services/photoStorage'
import { useUploadQueue } from './useUploadQueue'
import { enqueueFinalOutput } from '../services/uploadQueueService'

export function usePreviewLogic() {
  const navigate = useNavigate()
  const { event, loading: eventLoading } = useCurrentEvent()
  const [finalImageUrl, setFinalImageUrl] = useState('')
  const [optimizedImage, setOptimizedImage] = useState(null)
  const [videoClips, setVideoClips] = useState([])
  const [viewMode, setViewMode] = useState('photo')
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('idle')
  const [uploadError, setUploadError] = useState('')
  const [queuedOutputId, setQueuedOutputId] = useState(null)
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [frameError, setFrameError] = useState('')
  const [composedVideoBlob, setComposedVideoBlob] = useState(null)
  
  const [customMessage, setCustomMessage] = useState('')
  const [messageError, setMessageError] = useState('')
  const sigPad = useRef(null)

  const { processQueue, retry } = useUploadQueue({ eventId: event?.id })

  useEffect(() => {
    if (!event) return undefined
    let mounted = true
    let previewUrl = ''

    const composePreview = async () => {
      const activeSessionId = await getActiveSession(event.id)
      if (!activeSessionId) {
        if (mounted) navigate(`/e/${event.slug}`)
        return
      }

      const [photos, clips] = await Promise.all([
        getSelectedPhotos({ eventId: event.id, sessionId: activeSessionId }),
        getVideoClips({ eventId: event.id, sessionId: activeSessionId })
      ])

      if (photos.length !== 3) {
        if (mounted) navigate(`/e/${event.slug}/select`)
        return
      }

      const storedFrame = await getSelectedFrame({ eventId: event.id, sessionId: activeSessionId })
      const initialFrame = storedFrame || event.layoutConfig
      const canvas = await composeFinalCanvas(photos, initialFrame)
      const optimized = await optimizeFinalCanvas(canvas)
      canvas.width = 0
      canvas.height = 0
      
      let composedVideoUrl = ''
      let composedBlob = null
      try {
        if (clips && clips.length > 0) {
          const videoResult = await composeFinalVideo(clips, initialFrame)
          composedBlob = videoResult.blob
        }
      } catch (err) {
        console.error('Failed to compose final video:', err)
      }

      if (!mounted) return
      previewUrl = URL.createObjectURL(optimized.finalBlob)
      setSessionId(activeSessionId)
      setSelectedFrame(initialFrame)
      setOptimizedImage(optimized)
      setComposedVideoBlob(composedBlob)
      setFinalImageUrl(previewUrl)
      setVideoClips(composedBlob ? [composedBlob] : clips)
      setLoading(false)
    }

    composePreview()

    return () => {
      mounted = false
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [event, navigate])

  const finish = async () => {
    try {
      setSaving(true)
      setUploadStatus('uploading')
      setUploadError('')
      
      const signatureData = sigPad.current && !sigPad.current.isEmpty() ? sigPad.current.getTrimmedCanvas().toDataURL('image/png') : null;
      await Promise.all([
        saveSignature({ eventId: event.id, sessionId, signature: signatureData }),
        saveMessage({ eventId: event.id, sessionId, message: customMessage })
      ]);

      let finalOptImage = optimizedImage;
      let finalVidBlob = composedVideoBlob;
      const frame = selectedFrame || event.layoutConfig;

      if (customMessage && frame?.layoutConfig?.textBox) {
        const photos = await getSelectedPhotos({ eventId: event.id, sessionId });
        const canvas = await composeFinalCanvas(photos, frame, { message: customMessage });
        finalOptImage = await optimizeFinalCanvas(canvas);
        canvas.width = 0; canvas.height = 0;

        try {
          const clips = await getVideoClips({ eventId: event.id, sessionId });
          if (clips && clips.length > 0) {
            const videoResult = await composeFinalVideo(clips, frame, { message: customMessage });
            finalVidBlob = videoResult.blob;
          }
        } catch(err) {
          console.error('Failed to recompose video with message', err);
        }
      }

      const queuedOutput = await enqueueFinalOutput({ event, sessionId, optimizedImage: finalOptImage, selectedFrame, composedVideoBlob: finalVidBlob })
      setQueuedOutputId(queuedOutput.id)
      
      processQueue().catch(err => console.error("Background upload error:", err))
      
      setSaving(false)
      window.setTimeout(() => navigate(`/e/${event.slug}/success`), 350)
    } catch (error) {
      console.error("PreviewPage finish error:", error)
      alert("Lỗi khi xử lý: " + (error.message || "Unknown error"))
      setSaving(false)
    }
  }

  const retryUpload = async () => {
    if (!queuedOutputId) return
    setSaving(true)
    setUploadStatus('uploading')
    setUploadError('')
    const result = await retry(queuedOutputId)
    setSaving(false)

    if (result.status === 'success') {
      setUploadStatus('success')
      setUploadError('')
      window.setTimeout(() => navigate(`/e/${event.slug}/success`), 350)
      return
    }

    setUploadStatus('failed')
    setUploadError(result.errorMessage || 'Upload thất bại. Ảnh đã được giữ trong queue để thử lại.')
  }

  const handleMessageChange = (e) => {
    const val = e.target.value;
    const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 10) {
      setMessageError('Vui lòng nhập tối đa 10 chữ.');
    } else {
      setMessageError('');
      setCustomMessage(val);
    }
  }

  const clearSignature = () => {
    if (sigPad.current) {
      sigPad.current.clear();
    }
  }

  return {
    event,
    eventLoading,
    finalImageUrl,
    optimizedImage,
    videoClips,
    viewMode,
    loading,
    saving,
    uploadStatus,
    uploadError,
    queuedOutputId,
    selectedFrame,
    frameError,
    composedVideoBlob,
    customMessage,
    messageError,
    sigPad,
    setViewMode,
    finish,
    retryUpload,
    handleMessageChange,
    clearSignature
  }
}
