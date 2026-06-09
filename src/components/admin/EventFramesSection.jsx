import { Link } from 'react-router-dom'
import { EventFrameCard } from './EventFrameCard'

export function EventFramesSection({ event, frames, message, onDelete, onMigrateLegacy, onSetDefault, onToggle }) {
  const hasLegacy = frames.some((frame) => frame.isLegacy)

  return (
    <section className="mt-8 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-950">Khung ảnh của sự kiện</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Danh sách frame được đọc từ bảng event_frames theo event hiện tại.</p>
        </div>
        <Link className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-5 py-3 font-bold text-white" to={`/admin/events/${event.slug}/frames/new`}>Thêm frame</Link>
      </div>

      {message ? <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{message}</p> : null}

      {frames.length === 0 ? (
        <div className="mt-5 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
          <p className="font-bold text-slate-600">Sự kiện này chưa có khung ảnh nào</p>
          <Link className="mt-4 inline-flex rounded-2xl bg-purple-600 px-5 py-3 font-bold text-white" to={`/admin/events/${event.slug}/frames/new`}>Thêm frame</Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {frames.map((frame) => (
            <EventFrameCard eventSlug={event.slug} frame={frame} key={frame.id} onDelete={onDelete} onSetDefault={onSetDefault} onToggle={onToggle} />
          ))}
        </div>
      )}

      {hasLegacy ? (
        <button className="mt-4 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-black text-amber-800" onClick={onMigrateLegacy} type="button">
          Chuyển frame cũ sang hệ thống nhiều frame
        </button>
      ) : null}
    </section>
  )
}
