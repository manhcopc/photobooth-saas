import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentEvent } from './useCurrentEvent'
import { composeFinalCanvas } from '../utils/canvas'
import { composeFinalVideo } from '../utils/video'
import { optimizeFinalCanvas } from '../utils/imageOptimization'
import { getActiveSession, getSelectedFrame, getSelectedPhotos, saveCameraSettings, saveSelectedFrame, saveSignature, saveMessage, getVideoClips } from '../services/photoStorage'
import { useUploadQueue } from './useUploadQueue'
import { enqueueFinalOutput } from '../services/uploadQueueService'
import { getActiveFramesWithLegacyFallback } from '../services/eventFrameService'

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
  const [frames, setFrames] = useState([])
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

      const frameList = await getActiveFramesWithLegacyFallback(event)
      if (frameList.length === 0) {
        if (!mounted) return
        setFrameError('Sự kiện chưa có khung ảnh khả dụng.')
        setLoading(false)
        return
      }
      const storedFrame = await getSelectedFrame({ eventId: event.id, sessionId: activeSessionId })
      const initialFrame = frameList.find((f) => f.id === storedFrame?.id) || frameList.find((f) => f.isDefault) || frameList[0]
      const canvas = await composeFinalCanvas(photos, initialFrame || event.layoutConfig)
      const optimized = await optimizeFinalCanvas(canvas)
      canvas.width = 0
      canvas.height = 0
      
      let composedVideoUrl = ''
      let composedBlob = null
      try {
        if (clips && clips.length > 0) {
          const videoResult = await composeFinalVideo(clips, initialFrame || event.layoutConfig)
          composedBlob = videoResult.blob
        }
      } catch (err) {
        console.error('Failed to compose final video:', err)
      }

      if (!mounted) return
      previewUrl = URL.createObjectURL(optimized.finalBlob)
      setSessionId(activeSessionId)
      setFrames(frameList)
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

      const queuedOutput = await enqueueFinalOutput({ event, sessionId, optimizedImage, selectedFrame, composedVideoBlob })
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

  const chooseFrame = async (frame) => {
    if (!event || !sessionId) return
    const photos = await getSelectedPhotos({ eventId: event.id, sessionId })
    const canvas = await composeFinalCanvas(photos, frame || event.layoutConfig)
    const optimized = await optimizeFinalCanvas(canvas)
    canvas.width = 0
    canvas.height = 0
    if (finalImageUrl) URL.revokeObjectURL(finalImageUrl)
    const nextUrl = URL.createObjectURL(optimized.finalBlob)
    setSelectedFrame(frame)
    setOptimizedImage(optimized)
    setFinalImageUrl(nextUrl)
    await Promise.all([
      saveSelectedFrame({ eventId: event.id, sessionId, frame }),
      saveCameraSettings({ eventId: event.id, sessionId, cameraFacing: frame.preferredCameraFacing || 'user', captureOrientation: frame.preferredOrientation || 'portrait' }),
    ])
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
    frames,
    selectedFrame,
    frameError,
    composedVideoBlob,
    customMessage,
    messageError,
    sigPad,
    setViewMode,
    finish,
    retryUpload,
    chooseFrame,
    handleMessageChange,
    clearSignature
  }
}
