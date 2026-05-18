import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProgressSteps } from '../../components/common/ProgressSteps'
import { Button } from '../../components/common/Button'
import { PhotoGrid } from '../../components/booth/PhotoGrid'
import { getCaptures, saveSelectedPhotos } from '../../store/booth'

export function SelectPhotosPage() {
  const { slug = 'pink-party' } = useParams()
  const navigate = useNavigate()
  const [photos] = useState(getCaptures)
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (photos.length < 6) navigate(`/booth/${slug}/capture`)
  }, [navigate, photos.length, slug])

  const toggle = (photo) => {
    setSelected((current) => {
      if (current.includes(photo)) return current.filter((item) => item !== photo)
      if (current.length >= 3) return current
      return [...current, photo]
    })
  }

  const continueToPreview = () => {
    saveSelectedPhotos(selected)
    navigate(`/booth/${slug}/preview`)
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
        <Button className="w-full" disabled={selected.length !== 3} onClick={continueToPreview}>Tiếp tục ghép ảnh</Button>
      </div>
    </div>
  )
}
