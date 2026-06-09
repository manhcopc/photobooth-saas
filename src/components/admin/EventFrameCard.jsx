import { Link } from 'react-router-dom'

const Badge = ({ children, tone = 'slate' }) => {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
    slate: 'bg-slate-100 text-slate-600',
  }
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>
}

export function EventFrameCard({ eventSlug, frame, onDelete, onSetDefault, onToggle }) {
  return (
    <article className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <img alt={frame.name} className="aspect-[3/4] w-full rounded-2xl bg-slate-100 object-cover" src={frame.previewUrl || frame.overlayUrl || frame.frameUrl || frame.backgroundUrl} />
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <h4 className="font-black text-slate-950">{frame.name}</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {frame.isDefault ? <Badge tone="purple">Mặc định</Badge> : null}
            <Badge tone={frame.isActive ? 'emerald' : 'slate'}>{frame.isActive ? 'Đang bật' : 'Đã tắt'}</Badge>
            <Badge tone="amber">{frame.renderMode === 'background_overlay' ? 'Background + overlay' : 'Chỉ overlay'}</Badge>
            <Badge>{frame.preferredCameraFacing === 'environment' ? 'Cam sau' : 'Cam trước'} · {frame.preferredOrientation === 'landscape' ? 'Ngang' : 'Dọc'}</Badge>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm font-bold sm:grid-cols-2">
        <Link className="rounded-xl bg-purple-50 px-3 py-2 text-center text-purple-700" to={`/admin/events/${eventSlug}/frames/${frame.id}/editor`}>Chỉnh bố cục</Link>
        <button className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 disabled:opacity-50" disabled={frame.isDefault} onClick={() => onSetDefault(frame)} type="button">Đặt mặc định</button>
        <button className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700" onClick={() => onToggle(frame)} type="button">{frame.isActive ? 'Tắt' : 'Bật'}</button>
        <button className="rounded-xl bg-red-50 px-3 py-2 text-red-700" onClick={() => onDelete(frame)} type="button">Xóa</button>
      </div>
    </article>
  )
}
