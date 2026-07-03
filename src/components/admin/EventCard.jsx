import { Calendar, Images, QrCode, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export function EventCard({ event, imageCount = 0, onDelete }) {
  const isActive = event.status === 'active'

  const handleDelete = () => {
    if (onDelete && window.confirm('CẢNH BÁO: Hành động này không thể hoàn tác!\nBạn có chắc chắn muốn XÓA sự kiện này và TOÀN BỘ ảnh của khách hàng trên mây không?')) {
      onDelete(event.id)
    }
  }

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">{event.name}</h2>
            <p className="mt-1 text-sm text-slate-500">/e/{event.slug}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{event.status || 'active'}</span>
            {onDelete && (
              <button onClick={handleDelete} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors" title="Xóa sự kiện">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
          <span className="flex items-center gap-2"><Calendar size={16} /> {event.date || 'Chưa có ngày'}</span>
          <span className="flex items-center gap-2"><Images size={16} /> {imageCount} ảnh</span>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Link className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-bold text-white" to={`/admin/events/${event.slug}`}><QrCode size={16} /> Chi tiết</Link>
        <Link className="flex flex-1 items-center justify-center rounded-2xl bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700" to={`/admin/events/${event.slug}/gallery`}>Gallery</Link>
      </div>
    </article>
  )
}
