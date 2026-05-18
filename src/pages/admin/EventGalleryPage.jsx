import { Download, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { SyncStatusBadge } from '../../components/admin/SyncStatusBadge'
import { useUploadQueue } from '../../hooks/useUploadQueue'
import { getEventBySlug } from '../../services/eventStorage'
import { getFinalOutputs } from '../../services/finalOutputService'
import { getLocalFinalOutputs, retryUploadQueueItem, UPLOAD_QUEUE_STATUSES } from '../../services/uploadQueueService'

const buildGalleryItems = ({ remoteImages, localOutputs, queueItems, remoteAvailable }) => {
  const queueByLocalOutputId = new Map(queueItems.map((item) => [item.localOutputId, item]))
  const remoteIds = new Set(remoteImages.map((image) => image.id))
  const remoteGalleryItems = remoteImages.map((image) => ({
    id: image.id,
    eventId: image.eventId,
    sessionId: image.sessionId,
    imageUrl: image.thumbnailUrl || image.imageUrl,
    finalUrl: image.imageUrl,
    downloadUrl: image.imageUrl,
    createdAt: image.createdAt,
    status: UPLOAD_QUEUE_STATUSES.success,
    source: 'remote',
  }))
  const localGalleryItems = localOutputs
    .filter((output) => !remoteAvailable || !remoteIds.has(output.id))
    .map((output) => {
      const queueItem = queueByLocalOutputId.get(output.id)
      const status = queueItem?.status || output.status || UPLOAD_QUEUE_STATUSES.pending
      const remoteImageUrl = queueItem?.remoteImageUrl || output.remoteImageUrl
      const remoteThumbnailUrl = queueItem?.remoteThumbnailUrl || output.remoteThumbnailUrl
      const localThumbnailUrl = output.thumbnailBlob ? URL.createObjectURL(output.thumbnailBlob) : ''
      const localFinalUrl = output.finalBlob ? URL.createObjectURL(output.finalBlob) : ''
      const imageUrl = remoteThumbnailUrl || localThumbnailUrl || remoteImageUrl || localFinalUrl || output.imageDataUrl
      const finalUrl = remoteImageUrl || localFinalUrl || output.imageDataUrl || imageUrl

      return {
        id: output.id,
        eventId: output.eventId,
        sessionId: output.sessionId,
        imageUrl,
        finalUrl,
        downloadUrl: finalUrl,
        createdAt: output.createdAt,
        status,
        errorMessage: queueItem?.errorMessage || output.errorMessage,
        queueItemId: output.queueItemId,
        source: 'local',
      }
    })

  return [...remoteGalleryItems, ...localGalleryItems]
    .filter((item) => item.imageUrl)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

const loadGalleryData = async (slug, onGalleryError) => {
  const storedEvent = await getEventBySlug(slug)
  if (!storedEvent) return { storedEvent: null, storedImages: [], localOutputs: [], remoteAvailable: false }

  const localOutputs = await getLocalFinalOutputs(storedEvent.id)
  let remoteAvailable = true
  const storedImages = await getFinalOutputs(storedEvent.id).catch((error) => {
    remoteAvailable = false
    onGalleryError(error.message || 'Không thể tải gallery từ Supabase. Đang hiển thị ảnh local nếu có.')
    return []
  })

  return { storedEvent, storedImages, localOutputs, remoteAvailable }
}

export function EventGalleryPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [remoteImages, setRemoteImages] = useState([])
  const [localOutputs, setLocalOutputs] = useState([])
  const [remoteAvailable, setRemoteAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState('')
  const [galleryError, setGalleryError] = useState('')
  const { queue, refreshQueue } = useUploadQueue({ eventId: event?.id })

  useEffect(() => {
    let mounted = true

    const loadGallery = async () => {
      setGalleryError('')
      const { storedEvent, storedImages, localOutputs: storedLocalOutputs, remoteAvailable: canReadRemote } = await loadGalleryData(slug, setGalleryError)
      if (!mounted) return
      setEvent(storedEvent)
      setRemoteImages(storedImages)
      setLocalOutputs(storedLocalOutputs)
      setRemoteAvailable(canReadRemote)
      setLoading(false)
    }

    loadGallery()

    return () => {
      mounted = false
    }
  }, [slug])

  const galleryItems = useMemo(() => buildGalleryItems({
    remoteImages,
    localOutputs,
    queueItems: queue,
    remoteAvailable,
  }), [localOutputs, queue, remoteAvailable, remoteImages])

  useEffect(() => () => {
    galleryItems.forEach((item) => {
      if (item.source === 'local') {
        if (item.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(item.imageUrl)
        if (item.finalUrl?.startsWith('blob:') && item.finalUrl !== item.imageUrl) URL.revokeObjectURL(item.finalUrl)
      }
    })
  }, [galleryItems])

  const refreshGallery = async () => {
    setGalleryError('')
    const { storedEvent, storedImages, localOutputs: storedLocalOutputs, remoteAvailable: canReadRemote } = await loadGalleryData(slug, setGalleryError)
    setEvent(storedEvent)
    setRemoteImages(storedImages)
    setLocalOutputs(storedLocalOutputs)
    setRemoteAvailable(canReadRemote)
    await refreshQueue()
  }

  const retryUpload = async (id) => {
    setRetryingId(id)
    await retryUploadQueueItem(id)
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
          <p className="mt-2 text-slate-500">{galleryItems.length} ảnh final, ưu tiên Supabase và fallback local IndexedDB khi offline.</p>
        </div>
        <Link className="rounded-2xl bg-purple-50 px-5 py-3 font-bold text-purple-700" to={`/admin/events/${event.slug}`}>Quay lại chi tiết</Link>
      </div>
      {galleryError ? <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{galleryError}</p> : null}
      {galleryItems.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-lg font-bold text-slate-600">Chưa có ảnh nào. Hãy hoàn tất một lượt chụp ở user flow.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {galleryItems.map((image) => (
            <article className="overflow-hidden rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100" key={`${image.source}-${image.id}`}>
              <div className="relative">
                <a href={image.finalUrl} rel="noreferrer" target="_blank"><img alt="Ảnh final trong gallery" className="aspect-[2/3] w-full rounded-2xl object-cover" src={image.imageUrl} /></a>
                <div className="absolute left-2 top-2"><SyncStatusBadge status={image.status} /></div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>{new Date(image.createdAt).toLocaleString('vi-VN')}</span>
                <a className="rounded-xl bg-purple-50 p-2 text-purple-700" download={`${image.id}.webp`} href={image.downloadUrl}><Download size={16} /></a>
              </div>
              {image.status === UPLOAD_QUEUE_STATUSES.failed ? (
                <div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">
                  <p>{image.errorMessage || 'Upload thất bại.'}</p>
                  <button className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-purple-700" disabled={retryingId === image.queueItemId} onClick={() => retryUpload(image.queueItemId)} type="button">
                    <RefreshCw size={14} /> {retryingId === image.queueItemId ? 'Retrying...' : 'Retry upload'}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
