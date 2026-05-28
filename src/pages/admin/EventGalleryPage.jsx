import { Download, RefreshCw, X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SyncStatusBadge } from '../../components/admin/SyncStatusBadge'
import { useUploadQueue } from '../../hooks/useUploadQueue'
import { getEventBySlug } from '../../services/eventStorage'
import { getLocalGalleryItemsByEventId, revokeLocalGalleryItemUrls } from '../../services/localGalleryService'
import { getCloudFinalOutputsByEventId, incrementDownloadCount } from '../../services/supabaseGalleryService'
import { retryUploadQueueItem, UPLOAD_QUEUE_STATUSES } from '../../services/uploadQueueService'
import { createZipBlob } from '../../utils/zip'

const LOCAL_FALLBACK_MESSAGE = 'Đang hiển thị dữ liệu cục bộ do mất kết nối hoặc lỗi tải dữ liệu cloud'

const getDisplayStatus = (item, queueItem) => {
  if (item.source === 'cloud') return UPLOAD_QUEUE_STATUSES.success
  if (queueItem?.status) return queueItem.status
  if (item.syncStatus || item.status) return item.syncStatus || item.status
  return 'local_only'
}

const mergeGalleryItems = ({ cloudItems, localItems, queueItems, cloudAvailable }) => {
  const cloudIds = new Set(cloudItems.map((item) => item.id))
  const queueByLocalOutputId = new Map(queueItems.map((item) => [item.localOutputId, item]))
  const localFallbackItems = localItems
    .filter((item) => !cloudAvailable || !cloudIds.has(item.id))
    .map((item) => {
      const queueItem = queueByLocalOutputId.get(item.id)
      const remoteImageUrl = queueItem?.remoteImageUrl || item.remoteImageUrl
      const remoteThumbnailUrl = queueItem?.remoteThumbnailUrl || item.remoteThumbnailUrl
      const imageUrl = remoteThumbnailUrl || item.localThumbnailUrl || remoteImageUrl || item.localImageUrl || item.thumbnailUrl || item.imageUrl
      const finalUrl = remoteImageUrl || item.localImageUrl || item.imageUrl || imageUrl
      return {
        ...item,
        imageUrl,
        thumbnailUrl: imageUrl,
        finalUrl,
        downloadUrl: finalUrl,
        status: getDisplayStatus(item, queueItem),
        syncStatus: getDisplayStatus(item, queueItem),
        errorMessage: queueItem?.errorMessage || item.errorMessage,
      }
    })

  return [...cloudItems, ...localFallbackItems]
    .filter((item) => item.thumbnailUrl || item.imageUrl)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div className="animate-pulse rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-100" key={index}>
          <div className="aspect-[2/3] rounded-2xl bg-slate-100" />
          <div className="mt-3 h-4 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

export function EventGalleryPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [cloudItems, setCloudItems] = useState([])
  const [localItems, setLocalItems] = useState([])
  const [cloudAvailable, setCloudAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState('')
  const [galleryMessage, setGalleryMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const { queue, refreshQueue } = useUploadQueue({ eventId: event?.id })

  const loadGallery = useCallback(async () => {
    setGalleryMessage('')
    const storedEvent = await getEventBySlug(slug)
    if (!storedEvent) {
      setEvent(null)
      setLoading(false)
      return
    }

    let nextCloudItems = []
    let canReadCloud = true
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      canReadCloud = false
      setGalleryMessage(LOCAL_FALLBACK_MESSAGE)
    } else {
      nextCloudItems = await getCloudFinalOutputsByEventId(storedEvent.id).catch(() => {
        canReadCloud = false
        setGalleryMessage(LOCAL_FALLBACK_MESSAGE)
        return []
      })
    }

    const nextLocalItems = await getLocalGalleryItemsByEventId(storedEvent.id)
    setEvent(storedEvent)
    setCloudItems(nextCloudItems)
    setLocalItems((current) => {
      revokeLocalGalleryItemUrls(current)
      return nextLocalItems
    })
    setCloudAvailable(canReadCloud)
    setLoading(false)
    await refreshQueue()
  }, [refreshQueue, slug])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      if (!mounted) return
      await loadGallery()
    }

    load()

    return () => {
      mounted = false
    }
  }, [loadGallery])

  useEffect(() => () => revokeLocalGalleryItemUrls(localItems), [localItems])

  const galleryItems = useMemo(() => mergeGalleryItems({
    cloudItems,
    localItems,
    queueItems: queue,
    cloudAvailable,
  }), [cloudAvailable, cloudItems, localItems, queue])

  const retryUpload = async (id) => {
    if (!id) return
    setRetryingId(id)
    await retryUploadQueueItem(id)
    setRetryingId('')
    await loadGallery()
  }

  const downloadImage = async (image) => {
    const link = document.createElement('a')
    link.href = image.downloadUrl || image.finalUrl || image.imageUrl
    link.download = `photobooth-${event.slug}-${image.id}.webp`
    link.rel = 'noreferrer'
    link.click()
    if (image.source === 'cloud') await incrementDownloadCount(image.id, image.downloadCount)
  }

  const downloadZip = async () => {
    if (!event || downloadingZip) return
    if (galleryItems.length === 0) {
      setGalleryMessage('Chưa có ảnh để tải')
      return
    }
    setDownloadingZip(true)
    setGalleryMessage(galleryItems.length > 200 ? 'Gallery có nhiều ảnh, quá trình tạo ZIP có thể mất thời gian.' : 'Đang chuẩn bị file ZIP...')
    const files = []
    const safeSlug = String(event.slug || 'event').replace(/[^a-zA-Z0-9-_]/g, '-')

    for (let index = 0; index < galleryItems.length; index += 1) {
      const image = galleryItems[index]
      const sourceUrl = image.downloadUrl || image.finalUrl || image.imageUrl
      if (!sourceUrl) continue
      try {
        const response = await fetch(sourceUrl)
        if (!response.ok) continue
        const bytes = new Uint8Array(await response.arrayBuffer())
        const stamp = image.createdAt ? new Date(image.createdAt).toISOString().slice(0, 10) : null
        const filename = stamp ? `photobooth-${stamp}-${String(index + 1).padStart(3, '0')}.webp` : `photobooth-${String(index + 1).padStart(3, '0')}.webp`
        files.push({ path: `${safeSlug}/${filename}`, bytes, date: image.createdAt ? new Date(image.createdAt) : new Date() })
      } catch {
        // skip failed image download and continue
      }
    }

    if (files.length === 0) {
      setGalleryMessage('Không thể tải ảnh nào để tạo ZIP. Vui lòng thử lại.')
      setDownloadingZip(false)
      return
    }

    const zipBlob = await createZipBlob(files)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(zipBlob)
    link.download = `photobooth-${safeSlug}-gallery.zip`
    link.click()
    URL.revokeObjectURL(link.href)
    setGalleryMessage(`Đã tạo ZIP với ${files.length}/${galleryItems.length} ảnh.`)
    setDownloadingZip(false)
  }

  if (loading) {
    return (
      <section>
        <div className="mb-5">
          <h1 className="text-3xl font-black text-slate-950">Gallery</h1>
          <p className="mt-2 text-slate-500">Đang tải ảnh sự kiện...</p>
        </div>
        <GallerySkeleton />
      </section>
    )
  }

  if (!event) return <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600">Không tìm thấy sự kiện.</div>

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Gallery: {event.name}</h1>
          <p className="mt-2 text-slate-500">{galleryItems.length} ảnh final · Cloud-first Supabase, fallback local IndexedDB.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-2xl bg-purple-600 px-5 py-3 font-bold text-white disabled:opacity-60" disabled={downloadingZip} onClick={downloadZip} type="button">{downloadingZip ? 'Đang chuẩn bị ZIP...' : 'Tải toàn bộ ảnh ZIP'}</button>
          <Link className="rounded-2xl bg-purple-50 px-5 py-3 font-bold text-purple-700" to={`/admin/events/${event.slug}`}>Quay lại chi tiết</Link>
        </div>
      </div>
      {galleryMessage ? <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{galleryMessage}</p> : null}
      {galleryItems.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-lg font-bold text-slate-600">Chưa có ảnh nào trong sự kiện này</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {galleryItems.map((image) => (
            <article className="overflow-hidden rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-100" key={`${image.source}-${image.id}`}>
              <button className="relative block w-full overflow-hidden rounded-2xl bg-slate-100 text-left" onClick={() => setSelectedImage(image)} type="button">
                <img alt="Ảnh final trong gallery" className="aspect-[2/3] w-full object-cover" loading="lazy" src={image.thumbnailUrl || image.imageUrl} />
                <div className="absolute left-2 top-2"><SyncStatusBadge status={image.status} /></div>
              </button>
              <div className="mt-2 flex items-center justify-between gap-2 px-1 text-xs text-slate-500">
                <div><span>{new Date(image.createdAt).toLocaleString('vi-VN')}</span><p className="text-[10px]">Khung: {image.frameName || 'Khung mặc định'}</p></div>
                <button className="rounded-xl bg-purple-50 p-2 text-purple-700" onClick={() => downloadImage(image)} type="button"><Download size={16} /></button>
              </div>
              {image.status === UPLOAD_QUEUE_STATUSES.failed ? (
                <button className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700" disabled={retryingId === image.queueItemId} onClick={() => retryUpload(image.queueItemId)} type="button">
                  <RefreshCw size={14} /> {retryingId === image.queueItemId ? 'Retrying...' : 'Retry upload'}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {selectedImage ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">Ảnh photobooth</h2>
                <p className="mt-1 text-sm text-slate-500">{new Date(selectedImage.createdAt).toLocaleString('vi-VN')} · Khung: {selectedImage.frameName || 'Khung mặc định'}</p>
              </div>
              <button className="rounded-2xl bg-slate-100 p-2 text-slate-700" onClick={() => setSelectedImage(null)} type="button"><X size={20} /></button>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl bg-slate-100">
              <img alt="Ảnh final phóng lớn" className="max-h-[65vh] w-full object-contain" src={selectedImage.finalUrl || selectedImage.imageUrl} />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SyncStatusBadge status={selectedImage.status} />
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 font-bold text-white" onClick={() => downloadImage(selectedImage)} type="button"><Download size={18} /> Tải ảnh</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
