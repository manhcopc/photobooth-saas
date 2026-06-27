import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressSteps } from '../../components/common/ProgressSteps'
import { Button } from '../../components/common/Button'
import { PhotoGrid } from '../../components/booth/PhotoGrid'
import { useCurrentEvent } from '../../hooks/useCurrentEvent'
import { getActiveSession, getCaptures, saveSelectedPhotos } from '../../services/photoStorage'
import { EventNotFoundPage } from './EventNotFoundPage'
import { EventInactivePage } from './EventInactivePage'

export function SelectPhotosPage() {
  const navigate = useNavigate()
  const { event, loading: eventLoading } = useCurrentEvent()
  const [photos, setPhotos] = useState([])
  const [selected, setSelected] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!event) return
    let mounted = true

    const loadPhotos = async () => {
      const activeSessionId = await getActiveSession(event.id)
      if (!activeSessionId) {
        if (mounted) navigate(`/e/${event.slug}`)
        return
      }

      const storedPhotos = await getCaptures({ eventId: event.id, sessionId: activeSessionId })
      if (!mounted) return
      setSessionId(activeSessionId)
      setPhotos(storedPhotos)
      setLoading(false)
      if (storedPhotos.length < 6) navigate(`/e/${event.slug}/capture`)
    }

    loadPhotos()

    return () => {
      mounted = false
    }
  }, [event, navigate])

  const toggle = (photo) => {
    setSelected((current) => {
      if (current.includes(photo)) return current.filter((item) => item !== photo)
      if (current.length >= 3) return current
      return [...current, photo]
    })
  }

  const continueToPreview = async () => {
    try {
      setSaving(true)
      await saveSelectedPhotos({ eventId: event.id, sessionId, photos: selected })
      navigate(`/e/${event.slug}/preview`)
    } catch (error) {
      console.error("SelectPhotosPage continueToPreview error:", error)
      alert("Lỗi khi lưu ảnh chọn: " + (error.message || "Unknown error"))
      setSaving(false)
    }
  }

  if (eventLoading) {
    return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700 md:min-h-[820px]">Đang tải sự kiện...</div>
  }

  if (!event) return <EventNotFoundPage />
  if (event.status !== 'active') return <EventInactivePage />

  if (loading) {
    return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700 md:min-h-[820px]">Đang tải ảnh...</div>
  }

  return (
    <div className="min-h-svh md:min-h-[820px]">
      <ProgressSteps active={2} />
      <section className="px-5 pb-28">
        <h1 className="text-3xl font-black text-slate-950">Chọn 3 ảnh đẹp nhất</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Đã chọn {selected.length}/3 ảnh. Không thể chọn quá 3 ảnh.</p>
        <div className="mt-5"><PhotoGrid onToggle={toggle} photos={photos} selected={selected} /></div>
      </section>
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-white/90 p-5 backdrop-blur md:absolute">
        <Button className="w-full" disabled={selected.length !== 3 || saving} onClick={() => continueToPreview()}>{saving ? 'Đang lưu...' : 'Tiếp tục ghép ảnh'}</Button>
      </div>
    </div>
  )
}
