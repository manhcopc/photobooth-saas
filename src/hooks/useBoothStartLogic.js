import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentEvent } from './useCurrentEvent'
import { getActiveFramesWithLegacyFallback } from '../services/eventFrameService'
import { saveCameraSettings, saveCountdownSeconds, saveSelectedFrame, startPhotoSession } from '../services/photoStorage'

const COUNTDOWN_OPTIONS = [3, 5, 7, 10]
const getDeviceOrientation = () => (typeof window !== 'undefined' && window.matchMedia?.('(orientation: landscape)').matches ? 'landscape' : 'portrait')

export function useBoothStartLogic() {
  const navigate = useNavigate()
  const { event, loading } = useCurrentEvent()
  const defaultCountdown = Number(event?.defaultCountdownSeconds || 5)
  const [countdownSeconds, setCountdownSeconds] = useState(null)
  const [frames, setFrames] = useState([])
  const [selectedFrameId, setSelectedFrameId] = useState('')
  const [cameraFacing, setCameraFacing] = useState('user')
  const [captureOrientation, setCaptureOrientation] = useState('portrait')
  const [deviceOrientation, setDeviceOrientation] = useState(getDeviceOrientation)
  
  const selectedCountdownSeconds = countdownSeconds || defaultCountdown
  const selectedFrame = useMemo(() => frames.find((frame) => frame.id === selectedFrameId) || frames.find((frame) => frame.isDefault) || frames[0], [frames, selectedFrameId])

  useEffect(() => {
    if (!event) return undefined
    let mounted = true
    const loadFrames = async () => {
      const activeFrames = await getActiveFramesWithLegacyFallback(event).catch(() => [])
      if (!mounted) return
      setFrames(activeFrames)
      const preferredFrame = activeFrames.find((frame) => frame.isDefault) || activeFrames[0]
      if (preferredFrame) {
        setSelectedFrameId(preferredFrame.id)
        setCameraFacing(preferredFrame.preferredCameraFacing || 'user')
        setCaptureOrientation(preferredFrame.preferredOrientation || 'portrait')
      }
    }
    loadFrames()
    return () => { mounted = false }
  }, [event])

  useEffect(() => {
    const onChange = () => setDeviceOrientation(getDeviceOrientation())
    window.addEventListener('orientationchange', onChange)
    window.addEventListener('resize', onChange)
    return () => {
      window.removeEventListener('orientationchange', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [])

  const chooseFrame = (frame) => {
    setSelectedFrameId(frame.id)
    setCameraFacing(frame.preferredCameraFacing || 'user')
    setCaptureOrientation(frame.preferredOrientation || 'portrait')
  }

  const toggleCamera = () => {
    setCameraFacing((current) => (current === 'user' ? 'environment' : 'user'))
  }

  const toggleOrientation = () => {
    setCaptureOrientation((current) => (current === 'portrait' ? 'landscape' : 'portrait'))
  }

  const prepareSession = async () => {
    if (!event) return
    const sessionId = await startPhotoSession(event.id)
    const selectedCountdown = event.allowUserChangeCountdown ? selectedCountdownSeconds : defaultCountdown
    await Promise.all([
      saveCountdownSeconds({ eventId: event.id, sessionId, countdownSeconds: selectedCountdown }),
      saveCameraSettings({ eventId: event.id, sessionId, cameraFacing, captureOrientation }),
      selectedFrame ? saveSelectedFrame({ eventId: event.id, sessionId, frame: selectedFrame }) : Promise.resolve(),
    ])
    navigate(`/e/${event.slug}/capture`)
  }

  return {
    event,
    loading,
    defaultCountdown,
    countdownSeconds,
    setCountdownSeconds,
    frames,
    selectedFrameId,
    selectedFrame,
    cameraFacing,
    captureOrientation,
    deviceOrientation,
    selectedCountdownSeconds,
    COUNTDOWN_OPTIONS,
    chooseFrame,
    toggleCamera,
    toggleOrientation,
    prepareSession
  }
}
