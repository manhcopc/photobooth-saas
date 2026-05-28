import { ExternalLink, Images, Trash2, Upload } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { QRCodeCard } from '../../components/admin/QRCodeCard'
import { Button } from '../../components/common/Button'
import { defaultFrameConfig } from '../../data/mockEvents'
import { getEventAnalytics } from '../../services/analyticsService'
import { deleteEvent, getEventBySlug, updateEvent, uploadEventFrame } from '../../services/eventService'
import { getCloudFinalOutputsByEventId } from '../../services/supabaseGalleryService'
import { getPublicEventUrl } from '../../utils/getPublicEventUrl'
import { deleteEventFrame, getFramesWithLegacyFallback, migrateLegacyFrameToEventFrames, setDefaultFrame, updateEventFrame } from '../../services/eventFrameService'

export function EventDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [images, setImages] = useState([])
  const [form, setForm] = useState(null)
  const [frameFile, setFrameFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [frames, setFrames] = useState([])

  useEffect(() => {
    let mounted = true

    const loadEvent = async () => {
      const storedEvent = await getEventBySlug(slug)
      const storedImages = storedEvent ? await getCloudFinalOutputsByEventId(storedEvent.id).catch(() => []) : []
      if (!mounted) return
      setEvent(storedEvent)
      setImages(storedImages)
      setForm(storedEvent ? {
        name: storedEvent.name || '',
        slug: storedEvent.slug || '',
        description: storedEvent.description || '',
        date: storedEvent.date || '',
        status: storedEvent.status || 'active',
        frameUrl: storedEvent.frameUrl || defaultFrameConfig.overlaySrc,
        layoutConfig: JSON.stringify(storedEvent.layoutConfig || defaultFrameConfig, null, 2),
      } : null)
      if (storedEvent) {
        const eventAnalytics = await getEventAnalytics(storedEvent.id).catch(() => null)
        if (mounted) setAnalytics(eventAnalytics)
        const eventFrames = await getFramesWithLegacyFallback(storedEvent).catch(() => [])
        if (mounted) setFrames(eventFrames)
      }
      setLoading(false)
    }

    loadEvent()

    return () => {
      mounted = false
    }
  }, [slug])

  const update = (field) => (input) => setForm((current) => ({ ...current, [field]: input.target.value }))

  const save = async (submitEvent) => {
    submitEvent.preventDefault()
    if (!event || !form) return
    setSaving(true)
    setMessage('')
    try {
      let layoutConfig
      try {
        layoutConfig = JSON.parse(form.layoutConfig)
      } catch {
        throw new Error('Layout config phải là JSON hợp lệ.')
      }
      let frameUrl = form.frameUrl
      if (frameFile) frameUrl = await uploadEventFrame({ eventSlug: form.slug, file: frameFile })
      const updatedEvent = await updateEvent(event.id, {
        ...form,
        frameUrl,
        layoutConfig: {
          ...layoutConfig,
          overlaySrc: frameUrl,
        },
      })
      setEvent(updatedEvent)
      setForm((current) => ({ ...current, frameUrl, layoutConfig: JSON.stringify(updatedEvent.layoutConfig, null, 2) }))
      setMessage('Đã lưu event thành công.')
      if (updatedEvent.slug !== slug) navigate(`/admin/events/${updatedEvent.slug}`, { replace: true })
    } catch (error) {
      setMessage(error.message || 'Không thể lưu event.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!event) return
    const confirmed = window.confirm('Bạn chắc chắn muốn xóa event này? Metadata/gallery có thể bị ảnh hưởng. TODO: cleanup file storage sau.')
    if (!confirmed) return
    setSaving(true)
    try {
      await deleteEvent(event.id)
      navigate('/admin/events', { replace: true })
    } catch (error) {
      setMessage(error.message || 'Không thể xóa event.')
      setSaving(false)
    }
  }

  if (loading) return <div className="font-bold text-purple-700">Đang tải event...</div>
  if (!event || !form) return <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600">Không tìm thấy sự kiện.</div>

  const eventUrl = getPublicEventUrl(event.slug)
  const reloadFrames = async () => setFrames(await getFramesWithLegacyFallback(event).catch(() => []))

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-bold uppercase tracking-wide text-pink-500">Event detail</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-black text-slate-950">{event.name}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${event.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{event.status}</span>
        </div>
        <p className="mt-2 text-slate-500">Slug: /e/{event.slug} · {event.date}</p>
        <div className="mt-6 rounded-3xl bg-purple-50 p-4">
          <p className="text-sm font-black text-slate-950">Production URL</p>
          <p className="mt-2 break-all text-sm font-semibold text-purple-700">{eventUrl}</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 font-bold text-white" href={eventUrl} rel="noreferrer" target="_blank"><ExternalLink size={18} /> Mở event page</a>
          <Link className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-50 px-5 py-3 font-bold text-purple-700" to={`/admin/events/${event.slug}/gallery`}><Images size={18} /> Xem gallery ({images.length})</Link>
          <Link className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-700 sm:col-span-2" to={`/admin/events/${event.slug}/frame-editor`}>Chỉnh khung & bố cục</Link>
        </div>
        <div className="mt-8 rounded-3xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-black">Khung ảnh</h3>
            <Link className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-bold text-white" to={`/admin/events/${event.slug}/frame-editor`}>Thêm frame</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {frames.map((frame) => (
              <article className="rounded-2xl bg-white p-3" key={frame.id}>
                <img alt={frame.name} className="aspect-[3/4] w-full rounded-xl object-cover" src={frame.previewUrl || frame.frameUrl} />
                <p className="mt-2 font-black">{frame.name}</p>
                <p className="text-xs font-semibold text-slate-500">{frame.isDefault ? 'Mặc định' : ''} · {frame.isActive ? 'Đang bật' : 'Đã tắt'}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  <Link className="rounded-lg bg-purple-50 px-2 py-1 text-purple-700" to={`/admin/events/${event.slug}/frame-editor?frameId=${frame.id}`}>Chỉnh bố cục</Link>
                  {!frame.isLegacy ? <button className="rounded-lg bg-slate-100 px-2 py-1" onClick={async () => { await setDefaultFrame(event.id, frame.id); await reloadFrames() }} type="button">Đặt mặc định</button> : null}
                  {!frame.isLegacy ? <button className="rounded-lg bg-slate-100 px-2 py-1" onClick={async () => { await updateEventFrame(frame.id, { ...frame, isActive: !frame.isActive }); await reloadFrames() }} type="button">{frame.isActive ? 'Tắt' : 'Bật'}</button> : null}
                  {!frame.isLegacy ? <button className="rounded-lg bg-red-50 px-2 py-1 text-red-700" onClick={async () => { await deleteEventFrame(frame.id); await reloadFrames() }} type="button">Xóa</button> : null}
                </div>
              </article>
            ))}
          </div>
          {frames.some((f) => f.isLegacy) ? <button className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800" onClick={async () => { await migrateLegacyFrameToEventFrames(event); await reloadFrames() }} type="button">Chuyển frame cũ sang hệ thống nhiều frame</button> : null}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Tổng ảnh</p><p className="mt-1 text-2xl font-black text-slate-900">{analytics?.totalImages ?? 0}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Lượt tải</p><p className="mt-1 text-2xl font-black text-slate-900">{analytics?.totalDownloads ?? 0}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Ảnh đã đồng bộ</p><p className="mt-1 text-2xl font-black text-emerald-700">{analytics?.syncedCount ?? 0}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Ảnh chờ đồng bộ</p><p className="mt-1 text-2xl font-black text-amber-700">{analytics?.pendingCount ?? 0}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Event đang hoạt động</p><p className="mt-1 text-2xl font-black text-slate-900">{event.status === 'active' ? 'Có' : 'Không'}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Ảnh mới nhất</p><p className="mt-1 text-sm font-bold text-slate-700">{analytics?.latestImageAt ? new Date(analytics.latestImageAt).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}</p></div>
        </div>

        <form className="mt-8 grid gap-4" onSubmit={save}>
          <h2 className="text-2xl font-black text-slate-950">Chỉnh sửa event</h2>
          <label className="grid gap-2 font-bold text-slate-700">Tên event<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('name')} required value={form.name} /></label>
          <label className="grid gap-2 font-bold text-slate-700">Slug<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('slug')} required value={form.slug} /></label>
          <label className="grid gap-2 font-bold text-slate-700">Mô tả<textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('description')} value={form.description} /></label>
          <label className="grid gap-2 font-bold text-slate-700">Ngày event<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('date')} type="date" value={form.date || ''} /></label>
          <label className="grid gap-2 font-bold text-slate-700">Trạng thái<select className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('status')} value={form.status}><option value="active">active</option><option value="inactive">inactive</option></select></label>
          <label className="grid gap-2 font-bold text-slate-700">Frame URL<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('frameUrl')} value={form.frameUrl} /></label>
          <label className="grid gap-2 font-bold text-slate-700">Upload frame PNG/WebP<input accept="image/png,image/webp" className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={(event) => setFrameFile(event.target.files?.[0] || null)} type="file" /></label>
          {form.frameUrl ? <img alt="Preview frame" className="max-h-72 rounded-2xl border border-slate-100 object-contain" src={form.frameUrl} /> : null}
          <label className="grid gap-2 font-bold text-slate-700">Layout config JSON<textarea className="min-h-52 rounded-2xl border border-slate-200 px-4 py-3 font-mono text-xs" onChange={update('layoutConfig')} value={form.layoutConfig} /></label>
          {message ? <p className={`rounded-2xl p-3 text-sm font-bold ${message.startsWith('Đã') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{message}</p> : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button disabled={saving} type="submit">{saving ? 'Đang lưu...' : 'Save'}</Button>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-3 font-bold text-red-700" disabled={saving} onClick={remove} type="button"><Trash2 size={18} /> Xóa event</button>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><Upload size={16} /> Frame được upload vào bucket photobooth-frames.</span>
          </div>
        </form>
      </article>
      <QRCodeCard event={event} eventUrl={eventUrl} />
    </section>
  )
}
