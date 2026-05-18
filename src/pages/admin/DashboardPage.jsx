import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../../components/admin/EventCard'
import { StatCard } from '../../components/admin/StatCard'
import { getEvents } from '../../services/eventStorage'
import { getFinalImages } from '../../services/photoStorage'

export function DashboardPage() {
  const [events, setEvents] = useState([])
  const [images, setImages] = useState([])

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      const [storedEvents, storedImages] = await Promise.all([getEvents(), getFinalImages()])
      if (!mounted) return
      setEvents(storedEvents)
      setImages(storedImages)
    }

    loadDashboard()

    return () => {
      mounted = false
    }
  }, [])

  const countImagesForEvent = (eventId) => images.filter((image) => image.eventId === eventId).length

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard helper="IndexedDB/localforage" label="Tổng events" value={events.length} />
        <StatCard helper="Ảnh final đã tạo" label="Gallery" value={images.length} />
        <StatCard helper="Không cần backend" label="Trạng thái" value="MVP" />
      </section>
      <section className="rounded-3xl bg-gradient-to-r from-pink-500 to-purple-700 p-6 text-white shadow-lg shadow-purple-100">
        <h1 className="text-3xl font-black">Quản lý photobooth web app</h1>
        <p className="mt-2 max-w-2xl text-white/80">Tạo event, chia sẻ QR code và xem lại ảnh final ngay trong trình duyệt bằng IndexedDB qua localforage.</p>
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
