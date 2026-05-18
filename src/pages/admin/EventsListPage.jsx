import { useEffect, useState } from 'react'
import { EventCard } from '../../components/admin/EventCard'
import { getEvents } from '../../services/eventStorage'
import { getFinalImages } from '../../services/photoStorage'

export function EventsListPage() {
  const [events, setEvents] = useState([])
  const [images, setImages] = useState([])

  useEffect(() => {
    let mounted = true

    const loadEvents = async () => {
      const [storedEvents, storedImages] = await Promise.all([getEvents(), getFinalImages()])
      if (!mounted) return
      setEvents(storedEvents)
      setImages(storedImages)
    }

    loadEvents()

    return () => {
      mounted = false
    }
  }, [])

  const countImagesForEvent = (eventId) => images.filter((image) => image.eventId === eventId).length

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-3xl font-black text-slate-950">Danh sách event</h1>
        <p className="mt-2 text-slate-500">Dữ liệu event đang được lưu trong IndexedDB qua localforage.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => <EventCard event={event} imageCount={countImagesForEvent(event.id)} key={event.id} />)}
      </div>
    </section>
  )
}
