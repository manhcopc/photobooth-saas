import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { FrameLayoutEditor } from '../../components/admin/FrameLayoutEditor'
import { defaultFrameConfig } from '../../data/mockEvents'
import { getEventBySlug, updateEvent, uploadEventFrame } from '../../services/eventService'
import {
  createDefaultSlots,
  createEventFrame,
  getFrameById,
  getFramesByEventId,
  normalizeFrameLayout,
  setDefaultFrame,
  updateEventFrame,
  uploadFrameAsset,
} from '../../services/eventFrameService'

const loadLocalImageSize = (file, fallback) => new Promise((resolve) => {
  if (!file) return resolve(fallback)
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    URL.revokeObjectURL(url)
    resolve({ width: img.naturalWidth, height: img.naturalHeight })
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    resolve(fallback)
  }
  img.src = url
})

export function EventFrameEditorPage() {
  const { slug, frameId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const mode = frameId ? 'edit' : location.pathname.endsWith('/frames/new') ? 'new' : 'legacy'
  const [event, setEvent] = useState(null)
  const [currentFrame, setCurrentFrame] = useState(null)
  const [layout, setLayout] = useState(normalizeFrameLayout(defaultFrameConfig, defaultFrameConfig.overlaySrc))
  const [frameUrl, setFrameUrl] = useState(defaultFrameConfig.overlaySrc)
  const [frameFile, setFrameFile] = useState(null)
  const [frameName, setFrameName] = useState('Frame mới')
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const data = await getEventBySlug(slug)
      if (!mounted || !data) return
      setEvent(data)

      if (frameId) {
        const frame = await getFrameById(frameId)
        if (!mounted || !frame) return
        setCurrentFrame(frame)
        setFrameName(frame.name)
        setSetAsDefault(frame.isDefault)
        setFrameUrl(frame.frameUrl)
        setLayout(normalizeFrameLayout(frame.layoutConfig, frame.frameUrl))
        return
      }

      if (mode === 'legacy') {
        const legacyFrameUrl = data.frameUrl || defaultFrameConfig.overlaySrc
        setFrameUrl(legacyFrameUrl)
        setLayout(normalizeFrameLayout(data.layoutConfig, legacyFrameUrl))
      } else {
        setFrameName('Frame mới')
        setFrameUrl('')
        setLayout(normalizeFrameLayout(defaultFrameConfig, ''))
      }
    }
    load()
    return () => { mounted = false }
  }, [frameId, mode, slug])

  const title = useMemo(() => {
    if (mode === 'new') return 'Thêm frame'
    if (mode === 'edit') return 'Chỉnh bố cục frame'
    return 'Chỉnh frame legacy'
  }, [mode])

  const onSlotChange = (index, field, value) => {
    setLayout((current) => ({
      ...current,
      slots: current.slots.map((slot, slotIndex) => (slotIndex === index ? { ...slot, [field]: Number(value) } : slot)),
    }))
  }

  const onUploadFrame = async (file) => {
    if (!file) return
    setFrameFile(file)
    const dimension = await loadLocalImageSize(file, layout.canvas)
    const localUrl = URL.createObjectURL(file)
    setFrameUrl(localUrl)
    setLayout((current) => ({
      ...current,
      canvas: dimension,
      outputWidth: dimension.width,
      outputHeight: dimension.height,
      overlaySrc: localUrl,
      slots: current?.slots?.length === 3 ? current.slots : createDefaultSlots(dimension.width, dimension.height),
    }))
  }

  const resetDefault = () => {
    setLayout((current) => ({ ...current, slots: createDefaultSlots(current.canvas.width, current.canvas.height) }))
    setMessage('Đã đặt lại mặc định.')
  }

  const validate = () => {
    if (!layout.canvas.width || !layout.canvas.height) return 'Canvas không hợp lệ.'
    if (!Array.isArray(layout.slots) || layout.slots.length !== 3) return 'Cần đúng 3 vùng ảnh.'
    if (layout.slots.some((slot) => slot.width <= 0 || slot.height <= 0)) return 'Chiều rộng/chiều cao vùng ảnh phải lớn hơn 0.'
    if (mode === 'new' && !frameFile) return 'Vui lòng upload frame PNG/WebP.'
    if (!frameName.trim()) return 'Vui lòng nhập tên frame.'
    return ''
  }

  const save = async () => {
    if (!event) return
    const error = validate()
    if (error) {
      setMessage(error)
      return
    }

    setSaving(true)
    setMessage('')
    try {
      let uploadedFrameUrl = currentFrame?.frameUrl || (mode === 'legacy' ? event.frameUrl : frameUrl)
      if (frameFile) {
        uploadedFrameUrl = mode === 'legacy'
          ? await uploadEventFrame({ eventSlug: event.slug, file: frameFile })
          : await uploadFrameAsset({ eventSlug: event.slug, file: frameFile })
      }

      const nextLayout = normalizeFrameLayout({ ...layout, overlaySrc: uploadedFrameUrl }, uploadedFrameUrl)

      if (mode === 'new') {
        const existingFrames = await getFramesByEventId(event.id)
        const shouldBeDefault = setAsDefault || existingFrames.length === 0
        const created = await createEventFrame({
          eventId: event.id,
          name: frameName.trim(),
          frameUrl: uploadedFrameUrl,
          layoutConfig: nextLayout,
          isDefault: shouldBeDefault,
          isActive: true,
          sortOrder: existingFrames.length,
        })
        if (shouldBeDefault) await setDefaultFrame(event.id, created.id)
        navigate(`/admin/events/${event.slug}`, { replace: true })
        return
      }

      if (mode === 'edit' && currentFrame) {
        await updateEventFrame(currentFrame.id, {
          ...currentFrame,
          name: frameName.trim(),
          frameUrl: uploadedFrameUrl,
          layoutConfig: nextLayout,
          isDefault: setAsDefault || currentFrame.isDefault,
          isActive: currentFrame.isActive,
        })
        setMessage('Đã lưu bố cục frame thành công.')
      } else {
        await updateEvent(event.id, { ...event, frameUrl: uploadedFrameUrl, layoutConfig: nextLayout })
        setMessage('Đã lưu frame legacy thành công.')
      }
      setFrameFile(null)
      setFrameUrl(uploadedFrameUrl)
      setLayout(nextLayout)
    } catch (saveError) {
      setMessage(saveError.message || 'Không thể lưu frame.')
    } finally {
      setSaving(false)
    }
  }

  if (!event) return <div className="rounded-3xl bg-white p-8 font-bold">Đang tải...</div>

  return (
    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{event.name}</p>
        <div className="mt-4"><FrameLayoutEditor frameUrl={frameUrl} layoutConfig={layout} showMock /></div>
      </article>

      <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link className="rounded-xl bg-purple-50 px-4 py-2 font-bold text-purple-700" to={`/admin/events/${event.slug}`}>Quay lại event</Link>
          <label className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white">Upload frame<input accept="image/png,image/webp,image/jpeg" className="hidden" onChange={(e) => onUploadFrame(e.target.files?.[0])} type="file" /></label>
          <button className="rounded-xl bg-slate-200 px-4 py-2 font-bold" onClick={resetDefault} type="button">Đặt lại mặc định</button>
          <button className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white disabled:opacity-60" disabled={saving} onClick={save} type="button">{saving ? 'Đang lưu...' : 'Lưu'}</button>
        </div>

        {mode !== 'legacy' ? (
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <label className="text-sm font-bold">Tên frame<input className="mt-1 w-full rounded-lg border px-3 py-2" onChange={(e) => setFrameName(e.target.value)} value={frameName} /></label>
            <label className="inline-flex items-center gap-2 self-end text-sm font-bold"><input checked={setAsDefault} onChange={(e) => setSetAsDefault(e.target.checked)} type="checkbox" /> Đặt làm frame mặc định</label>
          </div>
        ) : null}

        <p className="mb-4 text-sm text-slate-500">Xem thử realtime theo tỉ lệ preview. Giá trị lưu là kích thước thật của canvas.</p>
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
