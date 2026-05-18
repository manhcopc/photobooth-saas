import { Download } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getEventBySlug } from '../../services/eventStorage'
import { getFinalImages } from '../../services/photoStorage'

export function EventGalleryPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadGallery = async () => {
      const storedEvent = await getEventBySlug(slug)
      const storedImages = storedEvent ? await getFinalImages(storedEvent.id) : []
      if (!mounted) return
      setEvent(storedEvent)
      setImages(storedImages)
      setLoading(false)
    }

    loadGallery()

    return () => {
      mounted = false
    }
  }, [slug])

  if (loading) return <div className="font-bold text-purple-700">Đang tải gallery...</div>
  if (!event) return <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600">Không tìm thấy sự kiện.</div>

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Gallery: {event.name}</h1>
          <p className="mt-2 text-slate-500">{images.length} ảnh final thuộc event này trong IndexedDB.</p>
        </div>
        <Link className="rounded-2xl bg-purple-50 px-5 py-3 font-bold text-purple-700" to={`/admin/events/${event.slug}`}>Quay lại chi tiết</Link>
      </div>
      {images.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-lg font-bold text-slate-600">Chưa có ảnh nào. Hãy hoàn tất một lượt chụp ở user flow.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((image) => (
            <article className="overflow-hidden rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100" key={image.id}>
              <img alt="Ảnh final trong gallery" className="aspect-[2/3] w-full rounded-2xl object-cover" src={image.dataUrl} />
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>{new Date(image.createdAt).toLocaleString('vi-VN')}</span>
                <a className="rounded-xl bg-purple-50 p-2 text-purple-700" download={`${image.id}.png`} href={image.dataUrl}><Download size={16} /></a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
