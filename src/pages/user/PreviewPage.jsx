import { Download, WandSparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressSteps } from '../../components/common/ProgressSteps'
import { Button } from '../../components/common/Button'
import { useCurrentEvent } from '../../hooks/useCurrentEvent'
import { composeFinalCanvas } from '../../utils/canvas'
import { optimizeFinalCanvas } from '../../utils/imageOptimization'
import { getActiveSession, getSelectedPhotos } from '../../services/photoStorage'
import { useUploadQueue } from '../../hooks/useUploadQueue'
import { enqueueFinalOutput } from '../../services/uploadQueueService'
import { EventNotFoundPage } from './EventNotFoundPage'

export function PreviewPage() {
  const navigate = useNavigate()
  const { event, loading: eventLoading } = useCurrentEvent()
  const [finalImageUrl, setFinalImageUrl] = useState('')
  const [optimizedImage, setOptimizedImage] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('idle')
  const [uploadError, setUploadError] = useState('')
  const [queuedOutputId, setQueuedOutputId] = useState(null)
  const { processQueue, retry } = useUploadQueue({ eventId: event?.id })

  useEffect(() => {
    if (!event) return undefined
    let mounted = true
    let previewUrl = ''

    const composePreview = async () => {
      const activeSessionId = await getActiveSession(event.id)
      if (!activeSessionId) {
        if (mounted) navigate(`/e/${event.slug}`)
        return
      }

      const photos = await getSelectedPhotos({ eventId: event.id, sessionId: activeSessionId })

      if (photos.length !== 3) {
        if (mounted) navigate(`/e/${event.slug}/select`)
        return
      }

      const canvas = await composeFinalCanvas(photos, event.layoutConfig)
      const optimized = await optimizeFinalCanvas(canvas)
      canvas.width = 0
      canvas.height = 0
      if (!mounted) return
      previewUrl = URL.createObjectURL(optimized.finalBlob)
      setSessionId(activeSessionId)
      setOptimizedImage(optimized)
      setFinalImageUrl(previewUrl)
      setLoading(false)
    }

    composePreview()

    return () => {
      mounted = false
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [event, navigate])

  const finish = async () => {
    setSaving(true)
    setUploadStatus('uploading')
    setUploadError('')
    const queuedOutput = await enqueueFinalOutput({ event, sessionId, optimizedImage })
    setQueuedOutputId(queuedOutput.id)
    processQueue()
    setSaving(false)
    window.setTimeout(() => navigate(`/e/${event.slug}/success`), 350)
  }

  const retryUpload = async () => {
    if (!queuedOutputId) return
    setSaving(true)
    setUploadStatus('uploading')
    setUploadError('')
    const result = await retry(queuedOutputId)
    setSaving(false)

    if (result.status === 'success') {
      setUploadStatus('success')
      setUploadError('')
      window.setTimeout(() => navigate(`/e/${event.slug}/success`), 350)
      return
    }

    setUploadStatus('failed')
    setUploadError(result.errorMessage || 'Upload thất bại. Ảnh đã được giữ trong queue để thử lại.')
  }

  if (eventLoading) {
    return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700 md:min-h-[820px]">Đang tải sự kiện...</div>
  }

  if (!event) return <EventNotFoundPage />

  return (
    <div className="min-h-svh md:min-h-[820px]">
      <ProgressSteps active={3} />
      <section className="px-5 pb-6 text-center">
        <h1 className="text-3xl font-black text-slate-950">Preview ảnh cuối</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Canvas xuất ảnh WebP tối ưu cho mobile.</p>
        <div className="mt-5 overflow-hidden rounded-[2rem] bg-purple-50 p-3 shadow-inner">
          {loading ? <div className="grid aspect-[2/3] place-items-center text-purple-700"><WandSparkles className="animate-pulse" size={48} /></div> : <img alt="Ảnh photobooth cuối" className="aspect-[2/3] w-full rounded-[1.5rem] object-cover" src={finalImageUrl} />}
        </div>
        <div className="mt-5 grid gap-3">
          <a className={`inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-bold text-purple-700 ring-1 ring-purple-100 ${!finalImageUrl ? 'pointer-events-none opacity-50' : ''}`} download="photobooth.webp" href={finalImageUrl || '#'}>
            <Download className="mr-2" size={18} /> Tải ảnh xuống
          </a>
          {uploadStatus !== 'idle' ? (
            <div className="rounded-2xl bg-purple-50 p-3 text-sm font-bold text-purple-700">
              {uploadStatus === 'uploading' ? 'uploading · Ảnh đã được đưa vào queue và đang đồng bộ...' : null}
              {uploadStatus === 'success' ? 'success · Upload thành công!' : null}
              {uploadStatus === 'failed' ? `failed · ${uploadError}` : null}
            </div>
          ) : null}
          {uploadStatus === 'failed' ? (
            <Button disabled={saving || !queuedOutputId} onClick={retryUpload} variant="secondary">{saving ? 'Đang retry...' : 'Retry upload'}</Button>
          ) : (
            <Button disabled={!optimizedImage || saving || uploadStatus === 'success'} onClick={finish}>{saving ? 'Đang upload...' : 'Hoàn tất'}</Button>
          )}
        </div>
      </section>
    </div>
  )
}
