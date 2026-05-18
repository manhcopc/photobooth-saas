import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { defaultFrameConfig } from '../../data/mockEvents'
import { createEvent, getEventBySlug, uploadEventFrame } from '../../services/eventService'
import { slugify } from '../../utils/slugify'

const SLUG_PATTERN = /^[a-z0-9-]+$/

export function CreateEventPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', slug: '', date: '', description: '', frameUrl: defaultFrameConfig.overlaySrc, status: 'active' })
  const [frameFile, setFrameFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const suggestedSlug = useMemo(() => slugify(form.name), [form.name])

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const slug = (form.slug || suggestedSlug).trim()
      if (!form.name.trim()) throw new Error('Tên event không được rỗng.')
      if (!slug) throw new Error('Slug không được rỗng.')
      if (!SLUG_PATTERN.test(slug)) throw new Error('Slug chỉ gồm chữ thường, số và dấu gạch ngang.')
      const duplicated = await getEventBySlug(slug).catch(() => null)
      if (duplicated) throw new Error('Slug đã tồn tại. Vui lòng chọn slug khác.')

      let frameUrl = form.frameUrl || defaultFrameConfig.overlaySrc
      if (frameFile) frameUrl = await uploadEventFrame({ eventSlug: slug, file: frameFile })
      const newEvent = await createEvent({
        ...form,
        slug,
        frameUrl,
        layoutConfig: {
          ...defaultFrameConfig,
          overlaySrc: frameUrl,
        },
      })
      navigate(`/admin/events/${newEvent.slug}`)
    } catch (error) {
      setMessage(error.message || 'Không thể tạo event.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h1 className="text-3xl font-black text-slate-950">Tạo event mới</h1>
      <p className="mt-2 text-slate-500">Event được lưu thật vào Supabase và có thể dùng ngay tại route /e/:slug.</p>
      <form className="mt-6 grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 font-bold text-slate-700">Tên event<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('name')} required value={form.name} /></label>
        <label className="grid gap-2 font-bold text-slate-700">Slug<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('slug')} placeholder={suggestedSlug || 'ten-event'} required value={form.slug} /></label>
        <label className="grid gap-2 font-bold text-slate-700">Ngày<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('date')} type="date" value={form.date} /></label>
        <label className="grid gap-2 font-bold text-slate-700">Trạng thái<select className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('status')} value={form.status}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <label className="grid gap-2 font-bold text-slate-700">Frame URL<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('frameUrl')} required value={form.frameUrl} /></label>
        <label className="grid gap-2 font-bold text-slate-700">Upload frame PNG/WebP<input accept="image/png,image/webp" className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={(event) => setFrameFile(event.target.files?.[0] || null)} type="file" /></label>
        {form.frameUrl ? <img alt="Preview frame" className="max-h-60 rounded-2xl border border-slate-100 object-contain" src={form.frameUrl} /> : null}
        <label className="grid gap-2 font-bold text-slate-700">Mô tả<textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('description')} value={form.description} /></label>
        {message ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600">{message}</p> : null}
        <Button className="mt-2" disabled={saving} type="submit">{saving ? 'Đang lưu...' : 'Lưu event'}</Button>
      </form>
    </section>
  )
}
