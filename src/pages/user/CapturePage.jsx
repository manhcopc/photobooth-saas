import { Camera, RefreshCw, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressSteps } from '../../components/common/ProgressSteps'
import { Button } from '../../components/common/Button'
import { useCamera } from '../../hooks/useCamera'
import { useCurrentEvent } from '../../hooks/useCurrentEvent'
import { getActiveSession, getCameraSettings, getCountdownSeconds, saveCameraSettings, saveCaptures } from '../../services/photoStorage'
import { captureVideoFrameItem } from '../../utils/images'
import { EventNotFoundPage } from './EventNotFoundPage'
import { EventInactivePage } from './EventInactivePage'

const TOTAL_PHOTOS = 6

export function CapturePage() {
  const navigate = useNavigate()
  const { event, loading: eventLoading } = useCurrentEvent()
  const [photos, setPhotos] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [countdownSeconds, setCountdownSeconds] = useState(5)
  const [cameraFacing, setCameraFacing] = useState('user')
  const [captureOrientation, setCaptureOrientation] = useState('portrait')
  const { videoRef, ready, error, warning, activeFacingMode } = useCamera(Boolean(event && sessionId), { facingMode: cameraFacing, orientation: captureOrientation })
  const [countdown, setCountdown] = useState(null)
  const [shooting, setShooting] = useState(false)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef(null)

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

  const takeOne = useCallback(() => {
    setShooting(true)
    setCountdown(countdownSeconds)
    let value = countdownSeconds
    timerRef.current = window.setInterval(() => {
      value -= 1
      if (value > 0) {
        setCountdown(value)
        return
      }
      window.clearInterval(timerRef.current)
      setCountdown(null)
      capturePhoto()
      setShooting(false)
    }, 900)
  }, [capturePhoto, countdownSeconds])

  useEffect(() => () => window.clearInterval(timerRef.current), [])

  useEffect(() => {
    if (ready && sessionId && photos.length < TOTAL_PHOTOS && !shooting && !saving) {
      const delay = window.setTimeout(takeOne, photos.length === 0 ? 700 : 1100)
      return () => window.clearTimeout(delay)
    }
  }, [ready, sessionId, photos.length, shooting, saving, takeOne])

  useEffect(() => {
    if (!event || !sessionId || photos.length === 0) return
    let mounted = true

    const persistPhotos = async () => {
      setSaving(true)
      await saveCaptures({ eventId: event.id, sessionId, photos })
      if (!mounted) return
      setSaving(false)
      if (photos.length >= TOTAL_PHOTOS) navigate(`/e/${event.slug}/select`)
    }

    persistPhotos()

    return () => {
      mounted = false
    }
  }, [event, navigate, photos, sessionId])

  if (eventLoading) {
    return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700 md:min-h-[820px]">Đang tải sự kiện...</div>
  }

  if (!event) return <EventNotFoundPage />
  if (event.status !== 'active') return <EventInactivePage />

  const isPortrait = captureOrientation === 'portrait'
  const controlsDisabled = shooting || saving || countdown !== null

  return (
    <div className="min-h-svh md:min-h-[820px]">
      <ProgressSteps active={1} />
      <section className="px-5 pb-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl">
          <video className={`${isPortrait ? 'aspect-[9/16]' : 'aspect-video'} w-full ${activeFacingMode === 'user' ? 'scale-x-[-1]' : ''} object-cover`} muted playsInline ref={videoRef} />
          {countdown ? <div className="absolute inset-0 grid place-items-center bg-slate-950/35 text-8xl font-black text-white">{countdown}</div> : null}
          {!ready && !error ? <div className="absolute inset-0 grid place-items-center text-white">Đang mở camera...</div> : null}
        </div>
        {warning ? <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">{warning}</p> : null}
        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-4 py-3 font-bold text-purple-700 ring-1 ring-purple-100 disabled:opacity-50" disabled={controlsDisabled} onClick={toggleCamera} type="button"><RefreshCw className="mr-2" size={16} /> Đổi camera</button>
          <button className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-4 py-3 font-bold text-purple-700 ring-1 ring-purple-100 disabled:opacity-50" disabled={controlsDisabled} onClick={toggleOrientation} type="button"><RotateCcw className="mr-2" size={16} /> Đổi hướng</button>
        </div>
        <p className="mt-3 rounded-2xl bg-purple-50 p-3 text-sm font-bold text-purple-700">Đang dùng: {activeFacingMode === 'environment' ? 'Cam sau' : 'Cam trước'} · {isPortrait ? 'Chụp dọc' : 'Chụp ngang'}</p>
        <div className="mt-5 flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-bold text-slate-500">Đã chụp</p>
            <p className="text-3xl font-black text-purple-700">{photos.length}/{TOTAL_PHOTOS}</p>
          </div>
          <Button disabled={!ready || shooting || saving || photos.length >= TOTAL_PHOTOS} onClick={takeOne}>
            <Camera className="mr-2" size={18} /> Chụp lại nhịp
          </Button>
        </div>
      </section>
    </div>
  )
}
