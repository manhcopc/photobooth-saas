import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FrameLayoutEditor } from '../../components/admin/FrameLayoutEditor'
import { defaultFrameConfig } from '../../data/mockEvents'
import { getEventBySlug, updateEvent, uploadEventFrame } from '../../services/eventService'

const createDefaultSlots = (width, height) => {
  const marginX = Math.round(width * 0.1)
  const slotWidth = Math.round(width * 0.8)
  const slotHeight = Math.round(height * 0.22)
  const startY = Math.round(height * 0.12)
  const gap = Math.round((height - startY * 2 - slotHeight * 3) / 2)
  return Array.from({ length: 3 }).map((_, i) => ({ x: marginX, y: startY + i * (slotHeight + gap), width: slotWidth, height: slotHeight, radius: 32 }))
}

const normalizeLayout = (layout, frameUrl) => {
  const width = layout?.canvas?.width || layout?.outputWidth || defaultFrameConfig.outputWidth
  const height = layout?.canvas?.height || layout?.outputHeight || defaultFrameConfig.outputHeight
  const slots = Array.isArray(layout?.slots) && layout.slots.length === 3 ? layout.slots : createDefaultSlots(width, height)
  return { canvas: { width, height }, outputWidth: width, outputHeight: height, overlaySrc: frameUrl || layout?.overlaySrc || defaultFrameConfig.overlaySrc, background: layout?.background || defaultFrameConfig.background, slots }
}

export function EventFrameEditorPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [layout, setLayout] = useState(normalizeLayout(defaultFrameConfig, defaultFrameConfig.overlaySrc))
  const [frameUrl, setFrameUrl] = useState(defaultFrameConfig.overlaySrc)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const data = await getEventBySlug(slug)
      if (!mounted || !data) return
      setEvent(data)
      const nextFrameUrl = data.frameUrl || defaultFrameConfig.overlaySrc
      setFrameUrl(nextFrameUrl)
      setLayout(normalizeLayout(data.layoutConfig, nextFrameUrl))
    }
    load()
    return () => { mounted = false }
  }, [slug])

  const hasFrame = Boolean(frameUrl)
  const hasLayout = useMemo(() => Array.isArray(layout?.slots) && layout.slots.length === 3, [layout])

  const onSlotChange = (index, field, value) => {
    setLayout((current) => ({ ...current, slots: current.slots.map((slot, i) => (i === index ? { ...slot, [field]: Number(value) } : slot)) }))
  }

  const resetDefault = () => {
    const width = layout.canvas.width
    const height = layout.canvas.height
    setLayout((current) => ({ ...current, slots: createDefaultSlots(width, height) }))
    setMessage('Đã đặt lại mặc định.')
  }

  const validate = () => {
    if (!layout.canvas.width || !layout.canvas.height) return 'Canvas không hợp lệ.'
    if (!Array.isArray(layout.slots) || layout.slots.length !== 3) return 'Cần đúng 3 vùng ảnh.'
    for (const slot of layout.slots) {
      if (slot.width <= 0 || slot.height <= 0) return 'Chiều rộng/chiều cao vùng ảnh phải lớn hơn 0.'
    }
    return ''
  }

  const saveLayout = async () => {
    if (!event) return
    const err = validate()
    if (err) return setMessage(err)
    setSaving(true)
    try {
      const payload = { ...layout, canvas: { width: layout.canvas.width, height: layout.canvas.height }, outputWidth: layout.canvas.width, outputHeight: layout.canvas.height, overlaySrc: frameUrl || defaultFrameConfig.overlaySrc }
      await updateEvent(event.id, { ...event, frameUrl, layoutConfig: payload })
      setMessage('Đã lưu bố cục thành công.')
    } catch (error) {
      setMessage(error.message || 'Không thể lưu bố cục.')
    } finally { setSaving(false) }
  }

  const onUploadFrame = async (file) => {
    if (!event || !file) return
    setSaving(true)
    setMessage('')
    try {
      const nextFrameUrl = await uploadEventFrame({ eventSlug: event.slug, file })
      const dimension = await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => resolve({ width: layout.canvas.width, height: layout.canvas.height })
        img.src = URL.createObjectURL(file)
      })
      setFrameUrl(nextFrameUrl)
      setLayout((current) => {
        const next = { ...current, canvas: dimension, outputWidth: dimension.width, outputHeight: dimension.height, overlaySrc: nextFrameUrl }
        if (!current?.slots?.length) next.slots = createDefaultSlots(dimension.width, dimension.height)
        return next
      })
      await updateEvent(event.id, { ...event, frameUrl: nextFrameUrl, layoutConfig: { ...layout, overlaySrc: nextFrameUrl } })
      setMessage('Đã upload khung ảnh thành công.')
    } catch (error) {
      setMessage(error.message || 'Upload khung ảnh thất bại.')
    } finally { setSaving(false) }
  }

  if (!event) return <div className="rounded-3xl bg-white p-8 font-bold">Đang tải...</div>

  return (
    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-2xl font-black">Khung ảnh</h1>
        <p className="mt-1 text-sm text-slate-500">{event.name}</p>
        <div className="mt-4"><FrameLayoutEditor frameUrl={frameUrl} layoutConfig={layout} showMock /></div>
        <div className="mt-4 grid gap-2 text-sm font-bold">
          <span className="rounded-xl bg-slate-100 px-3 py-2">{hasFrame ? 'Đã có frame' : 'Chưa có frame'}</span>
          <span className="rounded-xl bg-slate-100 px-3 py-2">{hasLayout ? 'Đã cấu hình layout' : 'Chưa cấu hình layout'}</span>
        </div>
      </article>

      <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link className="rounded-xl bg-purple-50 px-4 py-2 font-bold text-purple-700" to={`/admin/events/${event.slug}`}>Quay lại event</Link>
          <label className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white">Upload frame<input accept="image/png,image/webp,image/jpeg" className="hidden" onChange={(e) => onUploadFrame(e.target.files?.[0])} type="file" /></label>
          <button className="rounded-xl bg-slate-200 px-4 py-2 font-bold" onClick={resetDefault} type="button">Đặt lại mặc định</button>
          <button className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white disabled:opacity-60" disabled={saving} onClick={saveLayout} type="button">{saving ? 'Đang lưu...' : 'Lưu bố cục'}</button>
        </div>
        <p className="mb-4 text-sm text-slate-500">Xem thử realtime theo tỉ lệ preview.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {layout.slots.map((slot, index) => (
            <div className="rounded-2xl border border-slate-200 p-3" key={index}>
              <p className="mb-2 font-black">Vùng ảnh {index + 1}</p>
              {['x', 'y', 'width', 'height'].map((field) => (
                <label className="mb-2 grid gap-1 text-sm" key={field}>{field}<input className="rounded-lg border px-2 py-1" onChange={(e) => onSlotChange(index, field, e.target.value)} type="number" value={slot[field]} /></label>
              ))}
            </div>
          ))}
        </div>
        {message ? <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-700">{message}</p> : null}
      </article>
    </section>
  )
}
