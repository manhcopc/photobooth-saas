import { Calendar, Images, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'

export function EventCard({ event, imageCount = 0 }) {
  const isActive = event.status === 'active'

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">{event.name}</h2>
          <p className="mt-1 text-sm text-slate-500">/e/{event.slug}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{event.status || 'active'}</span>
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <span className="flex items-center gap-2"><Calendar size={16} /> {event.date || 'Chưa có ngày'}</span>
        <span className="flex items-center gap-2"><Images size={16} /> {imageCount} ảnh</span>
      </div>
      <div className="mt-5 flex gap-2">
        <Link className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-bold text-white" to={`/admin/events/${event.slug}`}><QrCode size={16} /> Chi tiết</Link>
        <Link className="flex flex-1 items-center justify-center rounded-2xl bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700" to={`/admin/events/${event.slug}/gallery`}>Gallery</Link>
      </div>
    </article>
  )
}
