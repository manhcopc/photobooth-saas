import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCamera } from './useCamera'
import { useCurrentEvent } from './useCurrentEvent'
import { getActiveSession, getCameraSettings, getCountdownSeconds, saveCameraSettings, saveCaptures } from '../services/photoStorage'
import { captureVideoFrameItem } from '../utils/images'

export function useCaptureLogic(TOTAL_PHOTOS = 6) {
  const navigate = useNavigate()
  const { event, loading: eventLoading } = useCurrentEvent()
  const [photos, setPhotos] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [countdownSeconds, setCountdownSeconds] = useState(5)
  const [cameraFacing, setCameraFacing] = useState('user')
  const [captureOrientation, setCaptureOrientation] = useState('portrait')
  
  const { videoRef, ready, error, warning, activeFacingMode } = useCamera(
    Boolean(event && sessionId), 
    { facingMode: cameraFacing, orientation: captureOrientation }
  )
  
  const [countdown, setCountdown] = useState(null)
  const [shooting, setShooting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [videoClips, setVideoClips] = useState([])
  
  const timerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  useEffect(() => {
    if (!event) return
    let mounted = true

    const loadSession = async () => {
      const activeSessionId = await getActiveSession(event.id)
      if (!mounted) return
      if (!activeSessionId) {
        navigate(`/e/${event.slug}`)
        return
      }
      const [storedCountdown, cameraSettings] = await Promise.all([
        getCountdownSeconds({ eventId: event.id, sessionId: activeSessionId }),
        getCameraSettings({ eventId: event.id, sessionId: activeSessionId }),
      ])
      setCountdownSeconds(Number(storedCountdown || event.defaultCountdownSeconds || 5))
      setCameraFacing(cameraSettings?.cameraFacing || 'user')
      setCaptureOrientation(cameraSettings?.captureOrientation || 'portrait')
      setSessionId(activeSessionId)
    }

    loadSession()

    return () => {
      mounted = false
    }
  }, [event, navigate])

  const persistCameraSettings = useCallback(async (nextFacing, nextOrientation) => {
    if (!event || !sessionId) return
    await saveCameraSettings({ eventId: event.id, sessionId, cameraFacing: nextFacing, captureOrientation: nextOrientation })
  }, [event, sessionId])

  const toggleCamera = async () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user'
    setCameraFacing(nextFacing)
    await persistCameraSettings(nextFacing, captureOrientation)
  }

  const toggleOrientation = async () => {
    const nextOrientation = captureOrientation === 'portrait' ? 'landscape' : 'portrait'
    setCaptureOrientation(nextOrientation)
    await persistCameraSettings(cameraFacing, nextOrientation)
  }

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const captureItem = captureVideoFrameItem(video, {
      cameraFacing: activeFacingMode,
      captureOrientation,
      mirror: activeFacingMode === 'user',
    })
    setPhotos((current) => [...current, captureItem])
  }, [activeFacingMode, captureOrientation, videoRef])

  const startRecording = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.srcObject) return
    recordedChunksRef.current = []
    
    try {
      const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') 
        ? { mimeType: 'video/webm;codecs=vp8,opus' } 
        : { mimeType: 'video/mp4' };
        
      const recorder = new MediaRecorder(video.srcObject, options)
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType })
        setVideoClips((current) => [...current, blob])
      }
      
      mediaRecorderRef.current = recorder
      recorder.start()
    } catch (err) {
      console.error('MediaRecorder error:', err)
    }
  }, [videoRef])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const takeOne = useCallback(() => {
    setShooting(true)
    setCountdown(countdownSeconds)
    let value = countdownSeconds
    
    startRecording()
    
    timerRef.current = window.setInterval(() => {
      value -= 1
      if (value > 0) {
        setCountdown(value)
        return
      }
      window.clearInterval(timerRef.current)
      setCountdown(null)
      capturePhoto()
      stopRecording()
      
      window.setTimeout(() => {
        setShooting(false)
      }, 800)
    }, 1000)
  }, [countdownSeconds, capturePhoto, startRecording, stopRecording])

  const handleStart = () => {
    if (!ready || photos.length >= TOTAL_PHOTOS) return
    takeOne()
  }

  const handleRetake = () => {
    setPhotos([])
    setVideoClips([])
    setCountdown(null)
    setShooting(false)
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }
  }

  const handleFinish = async () => {
    if (photos.length === 0 || !event || !sessionId) return
    setSaving(true)
    try {
      await saveCaptures({
        eventId: event.id,
        sessionId,
        photos,
        videoClips,
      })
      navigate(`/e/${event.slug}/select`)
    } catch (e) {
      console.error('Save failed', e)
      alert('Không thể lưu ảnh. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return {
    // State
    event,
    eventLoading,
    photos,
    sessionId,
    countdownSeconds,
    cameraFacing,
    captureOrientation,
    videoRef,
    ready,
    error,
    warning,
    activeFacingMode,
    countdown,
    shooting,
    saving,
    videoClips,
    TOTAL_PHOTOS,

    // Actions
    toggleCamera,
    toggleOrientation,
    handleStart,
    handleRetake,
    handleFinish,
    navigate
  }
}
