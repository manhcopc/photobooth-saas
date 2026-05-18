import { Download, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getEventBySlug } from '../../services/eventStorage'
import { getFinalOutputs, getQueuedFinalOutputs, retryQueuedFinalOutput } from '../../services/finalOutputService'

const loadGalleryData = async (slug, onGalleryError) => {
  const storedEvent = await getEventBySlug(slug)
  if (!storedEvent) return { storedEvent: null, storedImages: [], storedQueue: [] }

  const [storedImages, storedQueue] = await Promise.all([
    getFinalOutputs(storedEvent.id).catch((error) => {
      onGalleryError(error.message || 'Không thể tải gallery từ Supabase.')
      return []
    }),
    getQueuedFinalOutputs(storedEvent.id),
  ])

  return { storedEvent, storedImages, storedQueue }
}

export function EventGalleryPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [images, setImages] = useState([])
  const [queuedImages, setQueuedImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState('')
  const [galleryError, setGalleryError] = useState('')

  useEffect(() => {
    let mounted = true

    const loadGallery = async () => {
      setGalleryError('')
      const { storedEvent, storedImages, storedQueue } = await loadGalleryData(slug, setGalleryError)
      if (!mounted) return
      setEvent(storedEvent)
      setImages(storedImages)
      setQueuedImages(storedQueue.filter((item) => item.status === 'failed'))
      setLoading(false)
    }

    loadGallery()

    return () => {
      mounted = false
    }
  }, [slug])

  const refreshGallery = async () => {
    setGalleryError('')
    const { storedEvent, storedImages, storedQueue } = await loadGalleryData(slug, setGalleryError)
    setEvent(storedEvent)
    setImages(storedImages)
    setQueuedImages(storedQueue.filter((item) => item.status === 'failed'))
  }

  const retryUpload = async (id) => {
    setRetryingId(id)
    await retryQueuedFinalOutput(id)
    setRetryingId('')
    await refreshGallery()
  }

  if (loading) return <div className="font-bold text-purple-700">Đang tải gallery...</div>
  if (!event) return <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600">Không tìm thấy sự kiện.</div>

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Gallery: {event.name}</h1>
          <p className="mt-2 text-slate-500">{images.length} ảnh final đã sync trên Supabase.</p>
        </div>
        <Link className="rounded-2xl bg-purple-50 px-5 py-3 font-bold text-purple-700" to={`/admin/events/${event.slug}`}>Quay lại chi tiết</Link>
      </div>
      {galleryError ? <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{galleryError}</p> : null}
      {queuedImages.length ? (
        <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-amber-100">
          <h2 className="text-xl font-black text-slate-950">Ảnh upload failed trong IndexedDB queue</h2>
          <div className="mt-4 grid gap-3">
            {queuedImages.map((image) => (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-3" key={image.id}>
                <div className="min-w-0 text-sm">
                  <p className="truncate font-bold text-amber-900">{image.id}</p>
                  <p className="text-amber-700">failed · {image.error || 'Upload thất bại'}</p>
                </div>
                <button className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-purple-700" disabled={retryingId === image.id} onClick={() => retryUpload(image.id)} type="button">
                  <RefreshCw size={14} /> {retryingId === image.id ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {images.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-lg font-bold text-slate-600">Chưa có ảnh nào trên Supabase. Hãy hoàn tất một lượt chụp ở user flow.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((image) => (
            <article className="overflow-hidden rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100" key={image.id}>
              <img alt="Ảnh final trong gallery" className="aspect-[2/3] w-full rounded-2xl object-cover" src={image.imageUrl} />
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>{new Date(image.createdAt).toLocaleString('vi-VN')}</span>
                <a className="rounded-xl bg-purple-50 p-2 text-purple-700" download={`${image.id}.png`} href={image.imageUrl}><Download size={16} /></a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
