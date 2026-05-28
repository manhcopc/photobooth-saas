import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { FrameLayoutEditor } from '../../components/admin/FrameLayoutEditor'
import { defaultFrameConfig } from '../../data/mockEvents'
import { getEventBySlug, updateEvent, uploadEventFrame } from '../../services/eventService'
import {
  createDefaultSlots,
  createEventFrame,
  FRAME_RENDER_MODES,
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

const getLocalPreviewUrl = (file) => (file ? URL.createObjectURL(file) : '')

export function EventFrameEditorPage() {
  const { slug, frameId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const mode = frameId ? 'edit' : location.pathname.endsWith('/frames/new') ? 'new' : 'legacy'
  const [event, setEvent] = useState(null)
  const [currentFrame, setCurrentFrame] = useState(null)
  const [layout, setLayout] = useState(normalizeFrameLayout(defaultFrameConfig, defaultFrameConfig.overlaySrc))
  const [renderMode, setRenderMode] = useState(FRAME_RENDER_MODES.overlayOnly)
  const [overlayUrl, setOverlayUrl] = useState(defaultFrameConfig.overlaySrc)
  const [backgroundUrl, setBackgroundUrl] = useState('')
  const [overlayFile, setOverlayFile] = useState(null)
  const [backgroundFile, setBackgroundFile] = useState(null)
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
        setRenderMode(frame.renderMode || FRAME_RENDER_MODES.overlayOnly)
        setOverlayUrl(frame.overlayUrl || frame.frameUrl || '')
        setBackgroundUrl(frame.backgroundUrl || '')
        setLayout(normalizeFrameLayout(frame.layoutConfig, frame.overlayUrl || frame.frameUrl))
        return
      }

      if (mode === 'legacy') {
        const legacyFrameUrl = data.frameUrl || defaultFrameConfig.overlaySrc
        setRenderMode(FRAME_RENDER_MODES.overlayOnly)
        setOverlayUrl(legacyFrameUrl)
        setBackgroundUrl('')
        setLayout(normalizeFrameLayout(data.layoutConfig, legacyFrameUrl))
      } else {
        setFrameName('Frame mới')
        setRenderMode(FRAME_RENDER_MODES.overlayOnly)
        setOverlayUrl('')
        setBackgroundUrl('')
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

  const applyAssetDimension = async (file, previewUrl) => {
    const dimension = await loadLocalImageSize(file, layout.canvas)
    setLayout((current) => ({
      ...current,
      canvas: dimension,
      outputWidth: dimension.width,
      outputHeight: dimension.height,
      overlaySrc: previewUrl || current.overlaySrc,
      slots: current?.slots?.length === 3 ? current.slots : createDefaultSlots(dimension.width, dimension.height),
    }))
  }

  const onUploadOverlay = async (file) => {
    if (!file) return
    setOverlayFile(file)
    const localUrl = getLocalPreviewUrl(file)
    setOverlayUrl(localUrl)
    await applyAssetDimension(file, localUrl)
  }

  const onUploadBackground = async (file) => {
    if (!file) return
    setBackgroundFile(file)
    const localUrl = getLocalPreviewUrl(file)
    setBackgroundUrl(localUrl)
    await applyAssetDimension(file, overlayUrl)
  }

  const resetDefault = () => {
    setLayout((current) => ({ ...current, slots: createDefaultSlots(current.canvas.width, current.canvas.height) }))
    setMessage('Đã đặt lại mặc định.')
  }

  const validate = () => {
    if (!layout.canvas.width || !layout.canvas.height) return 'Canvas không hợp lệ.'
    if (!Array.isArray(layout.slots) || layout.slots.length !== 3) return 'Cần đúng 3 vùng ảnh.'
    if (layout.slots.some((slot) => slot.width <= 0 || slot.height <= 0)) return 'Chiều rộng/chiều cao vùng ảnh phải lớn hơn 0.'
    if (!overlayFile && !overlayUrl) return 'Vui lòng upload overlay image cho frame.'
    if (mode !== 'legacy' && !frameName.trim()) return 'Vui lòng nhập tên frame.'
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
      const targetFrameId = currentFrame?.id || frameId || `new-${Date.now()}`
      let uploadedOverlayUrl = currentFrame?.overlayUrl || currentFrame?.frameUrl || (mode === 'legacy' ? event.frameUrl : overlayUrl)
      let uploadedBackgroundUrl = currentFrame?.backgroundUrl || backgroundUrl || ''

      if (overlayFile) {
        uploadedOverlayUrl = mode === 'legacy'
          ? await uploadEventFrame({ eventSlug: event.slug, file: overlayFile })
          : await uploadFrameAsset({ eventSlug: event.slug, file: overlayFile, assetType: 'overlay', frameId: targetFrameId })
      }
      if (backgroundFile && mode !== 'legacy') {
        uploadedBackgroundUrl = await uploadFrameAsset({ eventSlug: event.slug, file: backgroundFile, assetType: 'background', frameId: targetFrameId })
      }

      const nextLayout = normalizeFrameLayout({ ...layout, overlaySrc: uploadedOverlayUrl }, uploadedOverlayUrl)

      if (mode === 'new') {
        const existingFrames = await getFramesByEventId(event.id)
        const shouldBeDefault = setAsDefault || existingFrames.length === 0
        const created = await createEventFrame({
          eventId: event.id,
          name: frameName.trim(),
          frameUrl: uploadedOverlayUrl,
          overlayUrl: uploadedOverlayUrl,
          backgroundUrl: renderMode === FRAME_RENDER_MODES.backgroundOverlay ? uploadedBackgroundUrl : '',
          renderMode,
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
          frameUrl: uploadedOverlayUrl,
          overlayUrl: uploadedOverlayUrl,
          backgroundUrl: renderMode === FRAME_RENDER_MODES.backgroundOverlay ? uploadedBackgroundUrl : '',
          renderMode,
          layoutConfig: nextLayout,
          isDefault: setAsDefault || currentFrame.isDefault,
          isActive: currentFrame.isActive,
        })
        setMessage('Đã lưu bố cục frame thành công.')
      } else {
        await updateEvent(event.id, { ...event, frameUrl: uploadedOverlayUrl, layoutConfig: nextLayout })
        setMessage('Đã lưu frame legacy thành công.')
      }
      setOverlayFile(null)
      setBackgroundFile(null)
      setOverlayUrl(uploadedOverlayUrl)
      setBackgroundUrl(uploadedBackgroundUrl)
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
        <div className="mt-4"><FrameLayoutEditor backgroundUrl={backgroundUrl} frameUrl={overlayUrl} layoutConfig={layout} renderMode={renderMode} showMock /></div>
        <div className="mt-4 grid gap-3 text-sm">
          {backgroundUrl && renderMode === FRAME_RENDER_MODES.backgroundOverlay ? <img alt="Preview background" className="max-h-36 rounded-xl border object-contain" src={backgroundUrl} /> : null}
          {overlayUrl ? <img alt="Preview overlay" className="max-h-36 rounded-xl border object-contain" src={overlayUrl} /> : null}
        </div>
      </article>

      <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link className="rounded-xl bg-purple-50 px-4 py-2 font-bold text-purple-700" to={`/admin/events/${event.slug}`}>Quay lại event</Link>
          <button className="rounded-xl bg-slate-200 px-4 py-2 font-bold" onClick={resetDefault} type="button">Đặt lại mặc định</button>
          <button className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white disabled:opacity-60" disabled={saving} onClick={save} type="button">{saving ? 'Đang lưu...' : 'Lưu'}</button>
        </div>

        {mode !== 'legacy' ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">Tên frame<input className="mt-1 w-full rounded-lg border px-3 py-2" onChange={(e) => setFrameName(e.target.value)} value={frameName} /></label>
            <label className="inline-flex items-center gap-2 self-end text-sm font-bold"><input checked={setAsDefault} onChange={(e) => setSetAsDefault(e.target.checked)} type="checkbox" /> Đặt làm frame mặc định</label>
            <label className="text-sm font-bold">Kiểu render<select className="mt-1 w-full rounded-lg border px-3 py-2" onChange={(event) => setRenderMode(event.target.value)} value={renderMode}><option value={FRAME_RENDER_MODES.overlayOnly}>Chỉ overlay</option><option value={FRAME_RENDER_MODES.backgroundOverlay}>Background + overlay</option></select></label>
          </div>
        ) : null}

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {renderMode === FRAME_RENDER_MODES.backgroundOverlay ? <label className="grid gap-2 text-sm font-bold">Upload background image<input accept="image/png,image/webp,image/jpeg" className="rounded-lg border px-3 py-2" onChange={(e) => onUploadBackground(e.target.files?.[0])} type="file" /></label> : null}
          <label className="grid gap-2 text-sm font-bold">Upload overlay image<input accept="image/png,image/webp,image/jpeg" className="rounded-lg border px-3 py-2" onChange={(e) => onUploadOverlay(e.target.files?.[0])} type="file" /></label>
        </div>

        <p className="mb-4 text-sm text-slate-500">Preview mô phỏng đúng thứ tự lớp: background → ảnh mẫu → overlay. Giá trị slot lưu theo kích thước canvas thật.</p>
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
