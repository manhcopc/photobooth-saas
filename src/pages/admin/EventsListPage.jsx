import { useEffect, useState } from 'react'
import { EventCard } from '../../components/admin/EventCard'
import { getFinalImages } from '../../store/booth'
import { getEvents } from '../../store/events'

export function EventsListPage() {
  const [events, setEvents] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadEvents = async () => {
      const [storedEvents, storedImages] = await Promise.all([getEvents(), getFinalImages()])
      if (!mounted) return
      setEvents(Array.isArray(storedEvents) ? storedEvents : [])
      setImages(Array.isArray(storedImages) ? storedImages : [])
      setLoading(false)
    }

    loadEvents()

    return () => {
      mounted = false
    }
  }, [])

  const imageCountBySlug = images.reduce((counts, image) => ({
    ...counts,
    [image.eventSlug]: (counts[image.eventSlug] || 0) + 1,
  }), {})

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-3xl font-black text-slate-950">Danh sách event</h1>
        <p className="mt-2 text-slate-500">Dữ liệu event đang được lưu trong IndexedDB.</p>
      </div>
      {loading ? <p className="rounded-3xl bg-white p-6 font-bold text-slate-500">Đang tải event...</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => <EventCard event={event} imageCount={imageCountBySlug[event.slug] || 0} key={event.id} />)}
      </div>
    </section>
  )
}
