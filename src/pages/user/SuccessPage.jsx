import { PartyPopper } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { useCurrentEvent } from '../../hooks/useCurrentEvent'
import { EventNotFoundPage } from './EventNotFoundPage'

export function SuccessPage() {
  const { event, loading } = useCurrentEvent()

  if (loading) {
    return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700 md:min-h-[820px]">Đang tải sự kiện...</div>
  }

  if (!event) return <EventNotFoundPage />

  return (
    <div className="grid min-h-svh place-items-center p-6 text-center md:min-h-[820px]">
      <div>
        <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-pink-400 to-purple-600 text-white shadow-xl shadow-pink-200">
          <PartyPopper size={48} />
        </div>
        <h1 className="mt-8 text-4xl font-black text-slate-950">Hoàn tất!</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">Ảnh của bạn đã được lưu vào gallery của sự kiện {event.name}.</p>
        <Button className="mt-8 w-full" to={`/e/${event.slug}`}>Chụp lượt mới</Button>
      </div>
    </div>
  )
}
