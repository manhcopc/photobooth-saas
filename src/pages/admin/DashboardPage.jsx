import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../../components/admin/EventCard'
import { StatCard } from '../../components/admin/StatCard'
import { getEvents } from '../../services/eventService'
import { getFinalOutputs } from '../../services/finalOutputService'

export function DashboardPage() {
  const [events, setEvents] = useState([])
  const [images, setImages] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        const [storedEvents, storedImages] = await Promise.all([getEvents(), getFinalOutputs().catch(() => [])])
        if (!mounted) return
        setEvents(storedEvents)
        setImages(storedImages)
      } catch (loadError) {
        if (mounted) setError(loadError.message || 'Không thể tải dashboard.')
      }
    }

    loadDashboard()

    return () => {
      mounted = false
    }
  }, [])

  const countImagesForEvent = (eventId) => images.filter((image) => image.eventId === eventId).length

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</p> : null}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard helper="Supabase events" label="Tổng events" value={events.length} />
        <StatCard helper="Ảnh final trên Supabase" label="Gallery" value={images.length} />
        <StatCard helper="Auth + CRUD thật" label="Trạng thái" value="Prod" />
      </section>
      <section className="rounded-3xl bg-gradient-to-r from-pink-500 to-purple-700 p-6 text-white shadow-lg shadow-purple-100">
        <h1 className="text-3xl font-black">Quản lý photobooth web app</h1>
        <p className="mt-2 max-w-2xl text-white/80">Tạo event, upload frame, chia sẻ QR code và xem gallery cloud-first.</p>
        <Link className="mt-5 inline-flex rounded-2xl bg-white px-5 py-3 font-bold text-purple-700" to="/admin/events/new">Tạo event mới</Link>
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-black">Events gần đây</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.slice(0, 3).map((event) => <EventCard event={event} imageCount={countImagesForEvent(event.id)} key={event.id} />)}
        </div>
      </section>
    </div>
  )
}
