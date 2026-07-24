import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentEvent } from './useCurrentEvent'
import { getActiveSession, getCaptures, saveSelectedPhotos, saveSelectedFrame } from '../services/photoStorage'
import { getActiveFramesWithLegacyFallback } from '../services/eventFrameService'

export function useSelectPhotosLogic() {
  const navigate = useNavigate()
  const { event, loading: eventLoading } = useCurrentEvent()
  const [photos, setPhotos] = useState([])
  const [selected, setSelected] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [frames, setFrames] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!event) return
    let mounted = true

    const loadPhotos = async () => {
      const activeSessionId = await getActiveSession(event.id)
      if (!activeSessionId) {
        if (mounted) navigate(`/e/${event.slug}`)
        return
      }

      const [storedPhotos, storedFrame, frameList] = await Promise.all([
        getCaptures({ eventId: event.id, sessionId: activeSessionId }),
        import('../services/photoStorage').then(m => m.getSelectedFrame({ eventId: event.id, sessionId: activeSessionId })),
        getActiveFramesWithLegacyFallback(event)
      ])
      
      if (!mounted) return
      setSessionId(activeSessionId)
      setPhotos(storedPhotos)
      setFrames(frameList)
      setSelectedFrame(storedFrame || frameList[0])
      setLoading(false)
      if (storedPhotos.length < 6) navigate(`/e/${event.slug}/capture`)
    }

    loadPhotos()

    return () => {
      mounted = false
    }
  }, [event, navigate])

  const toggle = (photo) => {
    setSelected((current) => {
      if (current.includes(photo)) return current.filter((item) => item !== photo)
      if (current.length >= 3) return current
      return [...current, photo]
    })
  }

  const handleAutoSelect = () => {
    if (photos.length >= 3) {
      setSelected(photos.slice(0, 3))
    }
  }

  const [livePreviewUrl, setLivePreviewUrl] = useState('')

  useEffect(() => {
    if (!selectedFrame && !event?.layoutConfig) return
    let mounted = true
    
    const updatePreview = async () => {
      try {
        const { composeFinalCanvas } = await import('../utils/canvas')
        const canvas = await composeFinalCanvas(selected, selectedFrame || event.layoutConfig)
        
        // optimize for fast preview
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
        canvas.width = 0
        canvas.height = 0
        
        if (mounted) {
          setLivePreviewUrl(dataUrl)
        }
      } catch (err) {
        console.error('Failed to generate live preview', err)
      }
    }
    
    updatePreview()
    
    return () => {
      mounted = false
    }
  }, [selected, selectedFrame, event])

  const handleClearSelection = () => {
    setSelected([])
  }

  const chooseFrame = async (frame) => {
    if (!sessionId) return
    setSelectedFrame(frame)
    await saveSelectedFrame({ eventId: event.id, sessionId, frame })
  }

  const continueToPreview = async () => {
    try {
      setSaving(true)
      await Promise.all([
        saveSelectedPhotos({ eventId: event.id, sessionId, photos: selected }),
        selectedFrame ? saveSelectedFrame({ eventId: event.id, sessionId, frame: selectedFrame }) : Promise.resolve()
      ])
      navigate(`/e/${event.slug}/preview`)
    } catch (error) {
      console.error("SelectPhotosPage continueToPreview error:", error)
      alert("Lỗi khi lưu ảnh chọn: " + (error.message || "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  return {
    event,
    eventLoading,
    photos,
    selected,
    frames,
    selectedFrame,
    livePreviewUrl,
    loading,
    saving,
    toggle,
    chooseFrame,
    continueToPreview,
    handleAutoSelect,
    handleClearSelection,
    navigate
  }
}
