import { Camera, RefreshCw, RotateCcw } from 'lucide-react'
import { ProgressSteps } from '../common/ProgressSteps'
import { Button } from '../common/Button'
import { EventNotFoundPage } from '../../pages/user/EventNotFoundPage'
import { EventInactivePage } from '../../pages/user/EventInactivePage'

export function MobileCaptureUI({
  event,
  eventLoading,
  photos,
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
  TOTAL_PHOTOS,
  toggleCamera,
  toggleOrientation,
  handleStart,
  handleRetake,
  handleFinish
}) {
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
          <Button disabled={!ready || shooting || saving || photos.length >= TOTAL_PHOTOS} onClick={handleStart}>
            <Camera className="mr-2" size={18} /> Chụp lại nhịp
          </Button>
        </div>
      </section>
    </div>
  )
}
