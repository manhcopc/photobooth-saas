import { Button } from '../common/Button'
import { ProgressSteps } from '../common/ProgressSteps'
import { BoothHeader } from '../booth/BoothHeader'
import { EventNotFoundPage } from '../../pages/user/EventNotFoundPage'
import { EventInactivePage } from '../../pages/user/EventInactivePage'

export function MobileBoothStartUI({
  event,
  loading,
  defaultCountdown,
  countdownSeconds,
  setCountdownSeconds,
  frames,
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
}) {
  if (loading) {
    return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700 md:min-h-[820px]">Đang tải sự kiện...</div>
  }

  if (!event) return <EventNotFoundPage />
  if (event.status !== 'active') return <EventInactivePage />

  return (
    <div className="min-h-svh md:min-h-[820px]">
      <ProgressSteps active={0} />
      <BoothHeader description={event.description} eyebrow="Sẵn sàng" title={event.name} />
      <section className="px-6 py-8">
        <div className="rounded-[2rem] bg-gradient-to-br from-pink-50 to-purple-50 p-5">
          <h2 className="text-xl font-black text-slate-950">Cách hoạt động</h2>
          <ol className="mt-4 space-y-3 text-left text-sm font-semibold text-slate-600">
            <li>1. Camera sẽ đếm ngược trước mỗi ảnh.</li>
            <li>2. Hệ thống chụp tổng cộng 6 ảnh.</li>
            <li>3. Bạn chọn đúng 3 ảnh để ghép frame.</li>
          </ol>
        </div>

        {selectedFrame ? (
          <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-purple-100">
            <h3 className="font-black text-slate-950">Frame đang chọn</h3>
            <p className="mt-1 text-sm font-bold text-purple-700">{selectedFrame.name}</p>
            {frames.length > 1 ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {frames.map((frame) => (
                  <button className={`rounded-2xl border p-2 text-left ${selectedFrame?.id === frame.id ? 'border-purple-600 ring-2 ring-purple-200' : 'border-slate-200'}`} key={frame.id} onClick={() => chooseFrame(frame)} type="button">
                    <img alt={frame.name} className="aspect-[2/3] w-full rounded-xl object-cover" src={frame.previewUrl || frame.overlayUrl || frame.frameUrl} />
                    <p className="mt-1 text-xs font-black">{frame.name}</p>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-purple-100">
          <h3 className="font-black text-slate-950">Cài đặt camera</h3>
          <p className="mt-2 text-sm font-bold text-slate-600">Camera mặc định: {cameraFacing === 'environment' ? 'Cam sau' : 'Cam trước'} · Hướng chụp: {captureOrientation === 'landscape' ? 'Ngang' : 'Dọc'}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="rounded-2xl bg-purple-50 px-3 py-3 text-sm font-black text-purple-700" onClick={toggleCamera} type="button">Đổi camera</button>
            <button className="rounded-2xl bg-purple-50 px-3 py-3 text-sm font-black text-purple-700" onClick={toggleOrientation} type="button">Đổi hướng chụp</button>
          </div>
          <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-700">
            {captureOrientation === 'landscape' ? 'Frame này phù hợp với chụp ngang. Vui lòng xoay điện thoại để có kết quả tốt nhất.' : 'Frame này phù hợp với chụp dọc.'}
            {deviceOrientation !== captureOrientation ? ` Bạn đang cầm máy ${deviceOrientation === 'landscape' ? 'ngang' : 'dọc'}, nhưng frame này phù hợp với chụp ${captureOrientation === 'landscape' ? 'ngang' : 'dọc'}.` : ''}
          </p>
        </div>

        <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-purple-100">
          <h3 className="font-black text-slate-950">Thời gian đếm ngược</h3>
          {event.allowUserChangeCountdown ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {COUNTDOWN_OPTIONS.map((option) => (
                <button className={`rounded-2xl px-3 py-3 text-sm font-black ${selectedCountdownSeconds === option ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'}`} key={option} onClick={() => setCountdownSeconds(option)} type="button">
                  {option} giây
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-2xl bg-purple-50 p-3 text-sm font-bold text-purple-700">Thời gian đếm ngược: {defaultCountdown} giây</p>
          )}
        </div>

        <Button className="mt-8 w-full" onClick={prepareSession}>Mở camera</Button>
      </section>
    </div>
  )
}
