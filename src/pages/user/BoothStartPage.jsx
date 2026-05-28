import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { ProgressSteps } from '../../components/common/ProgressSteps'
import { BoothHeader } from '../../components/booth/BoothHeader'
import { useCurrentEvent } from '../../hooks/useCurrentEvent'
import { saveCountdownSeconds, startPhotoSession } from '../../services/photoStorage'
import { EventNotFoundPage } from './EventNotFoundPage'
import { EventInactivePage } from './EventInactivePage'

const COUNTDOWN_OPTIONS = [3, 5, 7, 10]

export function BoothStartPage() {
  const navigate = useNavigate()
  const { event, loading } = useCurrentEvent()
  const defaultCountdown = Number(event?.defaultCountdownSeconds || 5)
  const [countdownSeconds, setCountdownSeconds] = useState(null)
  const selectedCountdownSeconds = countdownSeconds || defaultCountdown

  const prepareSession = async () => {
    if (!event) return
    const sessionId = await startPhotoSession(event.id)
    const selectedCountdown = event.allowUserChangeCountdown ? selectedCountdownSeconds : defaultCountdown
    await saveCountdownSeconds({ eventId: event.id, sessionId, countdownSeconds: selectedCountdown })
    navigate(`/e/${event.slug}/capture`)
  }

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
