import { useParams } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { ProgressSteps } from '../../components/common/ProgressSteps'
import { BoothHeader } from '../../components/booth/BoothHeader'
import { clearSession, setActiveEventSlug } from '../../store/booth'
import { getEventBySlug } from '../../store/events'

export function BoothStartPage() {
  const { slug = 'pink-party' } = useParams()
  const event = getEventBySlug(slug)

  const prepareSession = () => {
    clearSession()
    setActiveEventSlug(event.slug)
  }

  return (
    <div className="min-h-svh md:min-h-[820px]">
      <ProgressSteps active={0} />
      <BoothHeader description={event.description} eyebrow="Sẵn sàng" title={event.name} />
      <section className="px-6 py-8">
        <div className="rounded-[2rem] bg-gradient-to-br from-pink-50 to-purple-50 p-5">
          <h2 className="text-xl font-black text-slate-950">Cách hoạt động</h2>
          <ol className="mt-4 space-y-3 text-left text-sm font-semibold text-slate-600">
            <li>1. Camera sẽ đếm ngược 3-2-1 trước mỗi ảnh.</li>
            <li>2. Hệ thống chụp tổng cộng 6 ảnh.</li>
            <li>3. Bạn chọn đúng 3 ảnh để ghép frame.</li>
          </ol>
        </div>
        <Button className="mt-8 w-full" onClick={prepareSession} to={`/booth/${event.slug}/capture`}>Mở camera</Button>
      </section>
    </div>
  )
}
