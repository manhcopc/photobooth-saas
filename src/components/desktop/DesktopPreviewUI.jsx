import { Download, WandSparkles, PenTool, X, Check, ArrowRight, Image as ImageIcon, Film } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SignatureCanvas from 'react-signature-canvas'
import { EventNotFoundPage } from '../../pages/user/EventNotFoundPage'
import { EventInactivePage } from '../../pages/user/EventInactivePage'
import { VideoRecapPreview } from '../VideoRecapPreview'

export function DesktopPreviewUI({
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
  selectedFrame,
  frameError,
  composedVideoBlob,
  customMessage,
  messageError,
  sigPad,
  setViewMode,
  finish,
  retryUpload,
  handleMessageChange,
  clearSignature
}) {
  if (eventLoading || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-premium-bg text-premium-text flex-col gap-4">
        <WandSparkles className="animate-pulse text-premium-primary" size={48} />
        <p className="text-lg font-bold">Đang xử lý hình ảnh...</p>
      </div>
    )
  }

  if (!event) return <EventNotFoundPage />
  if (event.status !== 'active') return <EventInactivePage />

  return (
    <div className="flex h-screen w-full bg-premium-bg text-premium-text overflow-hidden font-sans">
      
      {/* CENTER PANEL - FINAL RESULT PREVIEW */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-black/20">
        <div className="flex items-center gap-2 mb-6 bg-premium-card/50 p-1 rounded-full backdrop-blur-md border border-premium-border">
          <button
            onClick={() => setViewMode('photo')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              viewMode === 'photo' ? 'bg-premium-primary text-white shadow-lg' : 'text-premium-text-muted hover:text-premium-text'
            }`}
          >
            <ImageIcon size={16} /> Ảnh Photobooth
          </button>
          <button
            onClick={() => setViewMode('video')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              viewMode === 'video' ? 'bg-premium-primary text-white shadow-lg' : 'text-premium-text-muted hover:text-premium-text'
            }`}
          >
            <Film size={16} /> Video Recap
          </button>
        </div>

        <div className="relative w-full max-w-[600px] h-[80vh] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {viewMode === 'photo' && finalImageUrl ? (
              <motion.img 
                key="photo"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                alt="Ảnh photobooth cuối" 
                className="w-auto h-full max-w-full rounded-[2rem] object-contain shadow-2xl" 
                src={finalImageUrl} 
              />
            ) : viewMode === 'video' ? (
              <motion.div 
                key="video"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-auto h-full max-w-full rounded-[2rem] overflow-hidden shadow-2xl bg-black"
              >
                {composedVideoBlob ? (
                  <video 
                    src={URL.createObjectURL(composedVideoBlob)} 
                    controls 
                    autoPlay 
                    loop 
                    playsInline 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoRecapPreview videos={videoClips.map((v) => v.url || v)} frameOrLayout={selectedFrame || event.layoutConfig} />
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT PANEL - SIGNATURE & FINISH */}
      <div className="w-[420px] border-l border-premium-border bg-premium-surface/50 backdrop-blur-xl p-8 flex flex-col z-10 shadow-2xl">
        <h2 className="text-2xl font-black mb-8">Kỷ niệm của bạn</h2>
        
        <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
          {/* Custom Message */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-premium-text-muted uppercase tracking-wider">
              Lời chúc (Tối đa 10 chữ)
            </label>
            <input 
              type="text" 
              className="w-full rounded-2xl bg-premium-card border border-premium-border p-4 text-premium-text outline-none focus:border-premium-primary focus:ring-1 focus:ring-premium-primary transition-all placeholder:text-premium-text-muted/50" 
              placeholder="Nhập lời chúc của bạn..." 
              value={customMessage}
              onChange={handleMessageChange}
            />
            {messageError && <p className="text-xs text-premium-danger font-medium">{messageError}</p>}
          </div>

          {/* Signature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-premium-text-muted uppercase tracking-wider">
                Chữ ký cá nhân
              </label>
              <button onClick={clearSignature} className="flex items-center text-xs font-bold text-premium-text hover:text-premium-danger transition-colors">
                <X size={14} className="mr-1" /> Xóa chữ ký
              </button>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-premium-border bg-white shadow-inner h-40">
              <SignatureCanvas 
                ref={sigPad} 
                penColor="black"
                canvasProps={{className: 'w-full h-full cursor-crosshair'}} 
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
                <PenTool size={64} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-8 border-t border-premium-border mt-auto space-y-4">
          {uploadStatus !== 'idle' && (
            <div className={`p-4 rounded-xl text-sm font-bold ${
              uploadStatus === 'uploading' ? 'bg-premium-primary/10 text-premium-primary' : 
              uploadStatus === 'success' ? 'bg-premium-success/10 text-premium-success' : 
              'bg-premium-danger/10 text-premium-danger'
            }`}>
              {uploadStatus === 'uploading' ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> 
                  Đang đồng bộ dữ liệu...
                </div>
              ) : null}
              {uploadStatus === 'success' ? 'Hoàn tất quá trình lưu!' : null}
              {uploadStatus === 'failed' ? `Lỗi: ${uploadError}` : null}
            </div>
          )}
          
          {uploadStatus === 'failed' ? (
            <button 
              disabled={saving || !queuedOutputId} 
              onClick={retryUpload}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-premium-text bg-premium-card border border-premium-border hover:bg-premium-surface transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang thử lại...' : 'Thử lại ngay'}
            </button>
          ) : (
            <button 
              onClick={finish}
              disabled={!optimizedImage || saving || uploadStatus === 'success'}
              className="w-full py-5 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg text-white bg-premium-primary hover:bg-premium-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:bg-premium-card disabled:text-premium-text-muted disabled:active:scale-100 shadow-[0_10px_40px_rgba(124,58,237,0.3)]"
            >
              {saving ? (
                <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <Check size={20} /> Hoàn Tất Phiên Chụp
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
