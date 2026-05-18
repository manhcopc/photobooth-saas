import { ExternalLink, Images } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { Link, useParams } from 'react-router-dom'
import { getFinalImages } from '../../store/booth'
import { getEventBySlug } from '../../store/events'

export function EventDetailPage() {
  const { slug = 'pink-party' } = useParams()
  const event = getEventBySlug(slug)
  const boothUrl = `${window.location.origin}/booth/${event.slug}`
  const images = getFinalImages(event.slug)

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-bold uppercase tracking-wide text-pink-500">Event detail</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">{event.name}</h1>
        <p className="mt-2 text-slate-500">/{event.slug} · {event.date}</p>
        <p className="mt-5 max-w-2xl leading-7 text-slate-600">{event.description}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 font-bold text-white" href={boothUrl} rel="noreferrer" target="_blank"><ExternalLink size={18} /> Mở booth</a>
          <Link className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-50 px-5 py-3 font-bold text-purple-700" to={`/admin/events/${event.slug}/gallery`}><Images size={18} /> Xem gallery ({images.length})</Link>
        </div>
        <div className="mt-8 rounded-3xl bg-slate-50 p-5">
          <h2 className="font-black text-slate-950">Frame config</h2>
          <pre className="mt-3 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-pink-100">{JSON.stringify(event.frameConfig, null, 2)}</pre>
        </div>
      </article>
      <aside className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
        <h2 className="text-2xl font-black text-slate-950">QR Code</h2>
        <p className="mt-2 text-sm text-slate-500">Quét để mở user flow của event.</p>
        <div className="mt-5 inline-block rounded-3xl bg-white p-4 shadow-inner ring-1 ring-purple-100">
          <QRCodeCanvas includeMargin size={260} value={boothUrl} />
        </div>
        <p className="mt-4 break-all rounded-2xl bg-purple-50 p-3 text-sm font-semibold text-purple-700">{boothUrl}</p>
      </aside>
    </section>
  )
}
