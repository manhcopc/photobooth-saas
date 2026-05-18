import { CheckCircle2 } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { ProgressSteps } from '../../components/common/ProgressSteps'
import { clearSession } from '../../store/booth'

export function SuccessPage() {
  return (
    <div className="min-h-svh md:min-h-[820px]">
      <ProgressSteps active={4} />
      <section className="flex flex-col items-center px-6 py-16 text-center">
        <div className="grid h-28 w-28 place-items-center rounded-full bg-green-100 text-green-600"><CheckCircle2 size={56} /></div>
        <h1 className="mt-8 text-4xl font-black text-slate-950">Xong rồi!</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Ảnh của bạn đã được lưu vào gallery localStorage. Cảm ơn bạn đã sử dụng photobooth.</p>
        <Button className="mt-8 w-full" onClick={clearSession} to="/booth/pink-party">Chụp lượt mới</Button>
        <Button className="mt-3 w-full" to="/" variant="secondary">Về trang chủ</Button>
      </section>
    </div>
  )
}
