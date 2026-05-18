import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { defaultFrameConfig } from '../../data/mockEvents'
import { createEvent } from '../../store/events'
import { slugify } from '../../utils/slugify'

export function CreateEventPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', slug: '', date: '', description: '' })
  const [saving, setSaving] = useState(false)
  const suggestedSlug = useMemo(() => slugify(form.name), [form.name])

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    const newEvent = await createEvent({
      ...form,
      slug: form.slug || suggestedSlug || `event-${Date.now()}`,
      frameConfig: defaultFrameConfig,
    })
    navigate(`/admin/events/${newEvent.slug}`)
  }

  return (
    <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h1 className="text-3xl font-black text-slate-950">Tạo event mới</h1>
      <p className="mt-2 text-slate-500">MVP dùng frame config mặc định, có thể mở rộng upload frame PNG sau.</p>
      <form className="mt-6 grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 font-bold text-slate-700">Tên event<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('name')} required value={form.name} /></label>
        <label className="grid gap-2 font-bold text-slate-700">Slug<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('slug')} placeholder={suggestedSlug || 'ten-event'} value={form.slug} /></label>
        <label className="grid gap-2 font-bold text-slate-700">Ngày<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('date')} required type="date" value={form.date} /></label>
        <label className="grid gap-2 font-bold text-slate-700">Mô tả<textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('description')} required value={form.description} /></label>
        <Button className="mt-2" disabled={saving} type="submit">{saving ? 'Đang lưu...' : 'Lưu event'}</Button>
      </form>
    </section>
  )
}
