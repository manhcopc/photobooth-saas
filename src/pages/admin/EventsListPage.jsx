import { EventCard } from '../../components/admin/EventCard'
import { getFinalImages } from '../../store/booth'
import { getEvents } from '../../store/events'

export function EventsListPage() {
  const events = getEvents()

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-3xl font-black text-slate-950">Danh sách event</h1>
        <p className="mt-2 text-slate-500">Dữ liệu event đang được lưu trong localStorage.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => <EventCard event={event} imageCount={getFinalImages(event.slug).length} key={event.id} />)}
      </div>
    </section>
  )
}
