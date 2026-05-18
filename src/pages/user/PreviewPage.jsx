import { Download, WandSparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressSteps } from '../../components/common/ProgressSteps'
import { Button } from '../../components/common/Button'
import { useCurrentEvent } from '../../hooks/useCurrentEvent'
import { composeFinalImage } from '../../utils/canvas'
import { getActiveSession, getSelectedPhotos } from '../../services/photoStorage'
import { retryQueuedFinalOutput, uploadFinalOutput } from '../../services/finalOutputService'
import { EventNotFoundPage } from './EventNotFoundPage'

export function PreviewPage() {
  const navigate = useNavigate()
  const { event, loading: eventLoading } = useCurrentEvent()
  const [finalImage, setFinalImage] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('idle')
  const [uploadError, setUploadError] = useState('')
  const [queuedOutputId, setQueuedOutputId] = useState(null)

  useEffect(() => {
    if (!event) return
    let mounted = true

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

      const dataUrl = await composeFinalImage(photos, event.layoutConfig)
      if (!mounted) return
      setSessionId(activeSessionId)
      setFinalImage(dataUrl)
      setLoading(false)
    }

    composePreview()

    return () => {
      mounted = false
    }
  }, [event, navigate])

  const handleUploadResult = (result) => {
    if (result.status === 'success') {
      setUploadStatus('success')
      setUploadError('')
      window.setTimeout(() => navigate(`/e/${event.slug}/success`), 450)
      return
    }

    setUploadStatus('failed')
    setQueuedOutputId(result.queuedOutput?.id || null)
    setUploadError(result.error?.message || result.queuedOutput?.error || 'Upload thất bại. Ảnh đã được giữ trong queue để thử lại.')
  }

  const finish = async () => {
    setSaving(true)
    setUploadStatus('uploading')
    setUploadError('')
    const result = await uploadFinalOutput({ event, sessionId, dataUrl: finalImage })
    setSaving(false)
    handleUploadResult(result)
  }

  const retryUpload = async () => {
    if (!queuedOutputId) return
    setSaving(true)
    setUploadStatus('uploading')
    setUploadError('')
    const result = await retryQueuedFinalOutput(queuedOutputId)
    setSaving(false)
    handleUploadResult(result)
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
        <p className="mt-2 text-sm font-semibold text-slate-500">Canvas xuất ảnh kích thước 1200 x 1800px.</p>
        <div className="mt-5 overflow-hidden rounded-[2rem] bg-purple-50 p-3 shadow-inner">
          {loading ? <div className="grid aspect-[2/3] place-items-center text-purple-700"><WandSparkles className="animate-pulse" size={48} /></div> : <img alt="Ảnh photobooth cuối" className="aspect-[2/3] w-full rounded-[1.5rem] object-cover" src={finalImage} />}
        </div>
        <div className="mt-5 grid gap-3">
          <a className={`inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-bold text-purple-700 ring-1 ring-purple-100 ${!finalImage ? 'pointer-events-none opacity-50' : ''}`} download="photobooth.jpg" href={finalImage || '#'}>
            <Download className="mr-2" size={18} /> Tải ảnh xuống
          </a>
          {uploadStatus !== 'idle' ? (
            <div className="rounded-2xl bg-purple-50 p-3 text-sm font-bold text-purple-700">
              {uploadStatus === 'uploading' ? 'uploading · Đang upload ảnh final lên Supabase...' : null}
              {uploadStatus === 'success' ? 'success · Upload thành công!' : null}
              {uploadStatus === 'failed' ? `failed · ${uploadError}` : null}
            </div>
          ) : null}
          {uploadStatus === 'failed' ? (
            <Button disabled={saving || !queuedOutputId} onClick={retryUpload} variant="secondary">{saving ? 'Đang retry...' : 'Retry upload'}</Button>
          ) : (
            <Button disabled={!finalImage || saving || uploadStatus === 'success'} onClick={finish}>{saving ? 'Đang upload...' : 'Hoàn tất'}</Button>
          )}
        </div>
      </section>
    </div>
  )
}
