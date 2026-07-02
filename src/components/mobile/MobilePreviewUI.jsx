import { Download, WandSparkles, PenTool, X } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { ProgressSteps } from '../common/ProgressSteps'
import { Button } from '../common/Button'
import { EventNotFoundPage } from '../../pages/user/EventNotFoundPage'
import { EventInactivePage } from '../../pages/user/EventInactivePage'
import { VideoRecapPreview } from '../VideoRecapPreview'

export function MobilePreviewUI({
  event,
  eventLoading,
  finalImageUrl,
  optimizedImage,
  videoClips,
  viewMode,
  loading,
  saving,
  uploadStatus,
  uploadError,
  queuedOutputId,
  frames,
  selectedFrame,
  frameError,
  composedVideoBlob,
  customMessage,
  messageError,
  sigPad,
  setViewMode,
  finish,
  retryUpload,
  chooseFrame,
  handleMessageChange,
  clearSignature
}) {
  if (eventLoading) {
    return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700 md:min-h-[820px]">Đang tải sự kiện...</div>
  }

  if (!event) return <EventNotFoundPage />
  if (event.status !== 'active') return <EventInactivePage />

  return (
    <div className="min-h-svh md:min-h-[820px]">
      <ProgressSteps active={3} />
      <section className="px-5 pb-6 text-center">
        <h1 className="text-3xl font-black text-slate-950">Review & Hoàn tất</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Thêm lời chúc và ký tên để lưu giữ kỷ niệm.</p>
        
        {frameError ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{frameError}</p> : null}
        
        {!loading && (
          <div className="mt-4 flex justify-center gap-2 mb-2">
            <button
              onClick={() => setViewMode('photo')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${viewMode === 'photo' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'}`}
            >
              Ảnh Final
            </button>
            <button
              onClick={() => setViewMode('video')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${viewMode === 'video' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'}`}
            >
              Video Recap
            </button>
          </div>
        )}

        <div className="mt-2 overflow-hidden rounded-[2rem] bg-purple-50 p-3 shadow-inner">
          {loading ? <div className="grid aspect-[2/3] place-items-center text-purple-700"><WandSparkles className="animate-pulse" size={48} /></div> : null}
          {!loading && finalImageUrl && viewMode === 'photo' ? <img alt="Ảnh photobooth cuối" className="aspect-[2/3] w-full rounded-[1.5rem] object-cover" src={finalImageUrl} /> : null}
          {!loading && finalImageUrl && viewMode === 'video' ? (
            <div className="rounded-[1.5rem] overflow-hidden">
              {composedVideoBlob ? (
                <video 
                  src={URL.createObjectURL(composedVideoBlob)} 
                  controls 
                  autoPlay 
                  loop 
                  playsInline 
                  className="aspect-[2/3] w-full bg-slate-100 object-cover" 
                />
              ) : (
                <VideoRecapPreview videos={videoClips.map((v) => v.url || v)} frameOrLayout={selectedFrame || event.layoutConfig} />
              )}
            </div>
          ) : null}
          {!loading && !finalImageUrl ? <div className="grid aspect-[2/3] place-items-center rounded-[1.5rem] text-sm font-bold text-slate-500">Chưa có preview</div> : null}
        </div>

        {frames.length > 1 ? (
          <div className="mt-4 text-left">
            <p className="mb-2 font-black text-slate-900">Chọn khung ảnh</p>
            <div className="grid grid-cols-2 gap-2">
              {frames.map((frame) => (
                <button className={`rounded-xl border p-2 text-left ${selectedFrame?.id === frame.id ? 'border-purple-600 ring-2 ring-purple-300' : 'border-slate-200'}`} key={frame.id} onClick={() => chooseFrame(frame)} type="button">
                  <img alt={frame.name} className="aspect-[2/3] w-full rounded-lg object-cover" src={frame.previewUrl || frame.frameUrl} />
                  <p className="mt-1 text-xs font-bold">{frame.name} {frame.isDefault ? '• Khung mặc định' : ''}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 text-left">
          <p className="mb-2 font-black text-slate-900">Lời chúc (Tối đa 10 chữ)</p>
          <input 
            type="text" 
            className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
            placeholder="Ví dụ: Happy Birthday!" 
            value={customMessage}
            onChange={handleMessageChange}
          />
          {messageError && <p className="mt-1 text-xs text-red-500">{messageError}</p>}
        </div>

        <div className="mt-6 text-left">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-black text-slate-900">Chữ ký của bạn</p>
            <button onClick={clearSignature} className="flex items-center text-xs text-slate-500 hover:text-purple-600">
              <X size={14} className="mr-1" /> Xóa
            </button>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
            <SignatureCanvas 
              ref={sigPad} 
              penColor="black"
              canvasProps={{className: 'w-full h-32 cursor-crosshair'}} 
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
              <PenTool size={48} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3">
          <a className={`inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-bold text-purple-700 ring-1 ring-purple-100 ${!finalImageUrl ? 'pointer-events-none opacity-50' : ''}`} download="photobooth.webp" href={finalImageUrl || '#'}>
            <Download className="mr-2" size={18} /> Tải ảnh xuống
          </a>
          
          {uploadStatus !== 'idle' ? (
            <div className="rounded-2xl bg-purple-50 p-3 text-sm font-bold text-purple-700">
              {uploadStatus === 'uploading' ? 'uploading · Đang lưu và đồng bộ dữ liệu...' : null}
              {uploadStatus === 'success' ? 'success · Hoàn tất!' : null}
              {uploadStatus === 'failed' ? `failed · ${uploadError}` : null}
            </div>
          ) : null}
          
          {uploadStatus === 'failed' ? (
            <Button disabled={saving || !queuedOutputId} onClick={retryUpload} variant="secondary">{saving ? 'Đang retry...' : 'Thử lại'}</Button>
          ) : (
            <Button disabled={!optimizedImage || saving || uploadStatus === 'success'} onClick={finish}>{saving ? 'Đang xử lý...' : 'Hoàn tất & Lưu'}</Button>
          )}
        </div>
      </section>
    </div>
  )
}
