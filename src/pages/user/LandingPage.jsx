import { Camera, Sparkles } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { BoothHeader } from '../../components/booth/BoothHeader'

export function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col justify-between p-6 md:min-h-[820px]">
      <div>
        <div className="mx-auto mt-6 grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-pink-400 to-purple-600 text-white shadow-xl shadow-pink-200">
          <Camera size={48} />
        </div>
        <BoothHeader
          description="Tạo bộ ảnh kỷ niệm trong vài phút: chụp 6 ảnh, chọn 3 ảnh đẹp nhất và nhận ngay file cuối cùng."
          eyebrow="Chào mừng"
          title="Photobooth xinh lung linh"
        />
        <div className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-purple-100">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-100 text-pink-600"><Sparkles /></span>
            <div>
              <p className="font-black text-slate-900">Mobile-first experience</p>
              <p className="text-sm text-slate-500">Tối ưu cho điện thoại, laptop xem như màn hình phone.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-3 pb-3">
        <Button className="w-full" to="/booth/pink-party">Bắt đầu chụp</Button>
        <Button className="w-full" to="/admin" variant="secondary">Vào trang admin</Button>
      </div>
    </div>
  )
}
