import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../../components/admin/EventCard'
import { getEvents } from '../../services/eventService'
import { getFinalOutputs } from '../../services/finalOutputService'

function EventsSkeleton() {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div className="h-56 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-100" key={index} />)}</div>
}

export function EventsListPage() {
  const [events, setEvents] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const loadEvents = async () => {
      try {
        const [storedEvents, storedImages] = await Promise.all([getEvents(), getFinalOutputs().catch(() => [])])
        if (!mounted) return
        setEvents(storedEvents)
        setImages(storedImages)
      } catch (loadError) {
        if (mounted) setError(loadError.message || 'Không thể tải danh sách event.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadEvents()

    return () => {
      mounted = false
    }
  }, [])

  const countImagesForEvent = (eventId) => images.filter((image) => image.eventId === eventId).length

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Danh sách event</h1>
          <p className="mt-2 text-slate-500">Dữ liệu event được đọc từ Supabase.</p>
        </div>
        <Link className="rounded-2xl bg-purple-600 px-5 py-3 font-bold text-white" to="/admin/events/new">Tạo event mới</Link>
      </div>
      {error ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</p> : null}
      {loading ? <EventsSkeleton /> : null}
      {!loading && events.length === 0 ? <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600 shadow-sm ring-1 ring-slate-100">Chưa có event nào. Hãy tạo event mới.</div> : null}
      {!loading && events.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{events.map((event) => <EventCard event={event} imageCount={countImagesForEvent(event.id)} key={event.id} />)}</div> : null}
    </section>
  )
}
