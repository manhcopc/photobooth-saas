import { Download, WandSparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProgressSteps } from '../../components/common/ProgressSteps'
import { Button } from '../../components/common/Button'
import { composeFinalImage } from '../../utils/canvas'
import { getSelectedPhotos, saveFinalImage } from '../../store/booth'
import { getEventBySlug } from '../../store/events'

export function PreviewPage() {
  const { slug = 'pink-party' } = useParams()
  const navigate = useNavigate()
  const [finalImage, setFinalImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    const composePreview = async () => {
      const [photos, event] = await Promise.all([getSelectedPhotos(), getEventBySlug(slug)])
      const safePhotos = Array.isArray(photos) ? photos : []

      if (safePhotos.length !== 3) {
        if (mounted) navigate(`/booth/${slug}/select`)
        return
      }

      const dataUrl = await composeFinalImage(safePhotos, event.frameConfig)
      if (!mounted) return
      setFinalImage(dataUrl)
      setLoading(false)
    }

    composePreview()

    return () => {
      mounted = false
    }
  }, [navigate, slug])

  const finish = async () => {
    setSaving(true)
    await saveFinalImage({ eventSlug: slug, dataUrl: finalImage })
    navigate(`/booth/${slug}/success`)
  }

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
          <Button disabled={!finalImage || saving} onClick={finish}>{saving ? 'Đang lưu...' : 'Hoàn tất'}</Button>
        </div>
      </section>
    </div>
  )
}
