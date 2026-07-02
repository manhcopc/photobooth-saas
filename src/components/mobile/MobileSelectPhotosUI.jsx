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
        <h1 className="text-3xl font-black text-slate-950">Chọn 3 ảnh đẹp nhất</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Đã chọn {selected.length}/3 ảnh. Không thể chọn quá 3 ảnh.</p>
        <div className="mt-5"><PhotoGrid onToggle={toggle} photos={photos} selected={selected} /></div>
      </section>
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-white/90 p-5 backdrop-blur md:absolute">
        <Button className="w-full" disabled={selected.length !== 3 || saving} onClick={continueToPreview}>
          {saving ? 'Đang lưu...' : 'Tiếp tục ghép ảnh'}
        </Button>
      </div>
    </div>
  )
}
