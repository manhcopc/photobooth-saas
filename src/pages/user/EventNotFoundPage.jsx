export function EventNotFoundPage() {
  return (
    <div className="grid min-h-svh place-items-center p-6 text-center md:min-h-[820px]">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-purple-100">
        <p className="text-sm font-bold uppercase tracking-wide text-pink-500">Photobooth</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Không tìm thấy sự kiện</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">Vui lòng kiểm tra lại đường dẫn QR hoặc liên hệ ban tổ chức.</p>
      </div>
    </div>
  )
}
