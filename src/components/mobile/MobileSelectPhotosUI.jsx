import { ProgressSteps } from '../common/ProgressSteps'
import { Button } from '../common/Button'
import { PhotoGrid } from '../booth/PhotoGrid'
import { EventNotFoundPage } from '../../pages/user/EventNotFoundPage'
import { EventInactivePage } from '../../pages/user/EventInactivePage'

export function MobileSelectPhotosUI({
  event,
  eventLoading,
  photos,
  selected,
  loading,
  saving,
  frames,
  selectedFrame,
  chooseFrame,
  livePreviewUrl,
  toggle,
  continueToPreview
}) {
  if (eventLoading) {
    return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700 md:min-h-[820px]">Đang tải sự kiện...</div>
  }

  if (!event) return <EventNotFoundPage />
  if (event.status !== 'active') return <EventInactivePage />

  if (loading) {
    return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700 md:min-h-[820px]">Đang tải ảnh...</div>
  }

  return (
    <div className="min-h-svh md:min-h-[820px]">
      <ProgressSteps active={2} />
      <section className="px-5 pb-28">
        <h1 className="text-3xl font-black text-slate-950">Chọn ảnh & Khung</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Đã chọn {selected.length}/3 ảnh. Không thể chọn quá 3 ảnh.</p>
        
        {livePreviewUrl && (
          <div className="mt-6 w-full rounded-[2rem] border border-slate-200 p-4 bg-slate-50 flex justify-center shadow-inner">
            <img src={livePreviewUrl} alt="Live Preview" className="max-h-[300px] object-contain drop-shadow-xl" />
          </div>
        )}

        {frames && frames.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Chọn khung ảnh</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {frames.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => chooseFrame(frame)}
                  className={`relative flex-shrink-0 w-[72px] h-[100px] rounded-xl overflow-hidden border-2 transition-all ${
                    selectedFrame?.id === frame.id 
                      ? 'border-purple-600 shadow-[0_0_15px_rgba(124,58,237,0.4)] scale-105' 
                      : 'border-slate-200 opacity-70'
                  }`}
                >
                  <img src={frame.overlayUrl} alt={frame.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8"><PhotoGrid onToggle={toggle} photos={photos} selected={selected} /></div>
      </section>
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-white/90 p-5 backdrop-blur md:absolute">
        <Button className="w-full" disabled={selected.length !== 3 || saving} onClick={continueToPreview}>
          {saving ? 'Đang lưu...' : 'Tiếp tục ghép ảnh'}
        </Button>
      </div>
    </div>
  )
}
