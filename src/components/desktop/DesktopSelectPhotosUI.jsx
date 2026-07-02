import { Check, X, Wand2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { EventNotFoundPage } from '../../pages/user/EventNotFoundPage'
import { EventInactivePage } from '../../pages/user/EventInactivePage'

export function DesktopSelectPhotosUI({
  event,
  eventLoading,
  photos,
  selected,
  livePreviewUrl,
  loading,
  saving,
  toggle,
  continueToPreview,
  handleAutoSelect,
  handleClearSelection
}) {
  if (eventLoading || loading) {
    return <div className="grid min-h-screen place-items-center bg-premium-bg text-premium-text">Đang tải...</div>
  }

  if (!event) return <EventNotFoundPage />
  if (event.status !== 'active') return <EventInactivePage />

  return (
    <div className="flex h-screen w-full bg-premium-bg text-premium-text overflow-hidden font-sans">
      {/* LEFT PANEL - Photo Grid */}
      <div className="flex-1 p-10 flex flex-col h-full relative">
        <div className="mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-premium-text to-premium-text-muted bg-clip-text text-transparent">Chọn 3 bức ảnh đẹp nhất</h1>
          <p className="text-premium-text-muted mt-2">Nhấp vào ảnh để chọn. Thứ tự chọn sẽ quyết định vị trí trên khung ảnh.</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
          <div className="grid grid-cols-3 gap-6">
            {photos.map((photo, index) => {
              const isSelected = selected.includes(photo)
              const selectedIndex = selected.indexOf(photo)
              
              return (
                <motion.div 
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggle(photo)}
                  className={`relative cursor-pointer rounded-[2rem] overflow-hidden aspect-[3/4] border-4 transition-all duration-300 ${
                    isSelected ? 'border-premium-primary shadow-[0_0_30px_rgba(124,58,237,0.3)]' : 'border-transparent hover:border-premium-border bg-premium-card'
                  }`}
                >
                  <img 
                    src={photo.photoDataUrl || photo.imageUrl} 
                    alt={`Capture ${index + 1}`} 
                    className={`w-full h-full object-cover transition-transform duration-500 ${photo.mirror ? 'scale-x-[-1]' : ''} ${isSelected ? 'scale-105' : ''}`}
                  />
                  
                  {isSelected && (
                    <div className="absolute inset-0 bg-premium-primary/10 backdrop-blur-[2px]">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 w-10 h-10 bg-premium-primary text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg border-2 border-white/20"
                      >
                        {selectedIndex + 1}
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Live Preview & Actions */}
      <div className="w-[450px] border-l border-premium-border bg-premium-surface/80 backdrop-blur-2xl p-8 flex flex-col shadow-2xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Bản xem trước</h2>
          <div className="px-4 py-1.5 rounded-full bg-premium-card border border-premium-border text-sm font-bold">
            <span className={selected.length === 3 ? 'text-premium-primary' : 'text-premium-text'}>
              {selected.length}
            </span>
            <span className="text-premium-text-muted"> / 3</span>
          </div>
        </div>

        {/* Live Preview Strip */}
        <div className="flex-1 bg-black/40 rounded-[2rem] border border-premium-border/50 p-6 flex items-center justify-center shadow-inner overflow-hidden relative">
          {livePreviewUrl ? (
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={livePreviewUrl}
              alt="Live Preview"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-premium-text-muted/50 gap-4 w-full h-full">
              <div className="w-8 h-8 rounded-full border-4 border-premium-border border-t-premium-primary animate-spin" />
              <span className="text-sm font-medium uppercase tracking-widest">Đang tải bản xem trước</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleClearSelection}
              disabled={selected.length === 0}
              className="py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm bg-premium-card border border-premium-border hover:bg-premium-border/50 transition-colors disabled:opacity-50"
            >
              <X size={16} /> Xóa chọn
            </button>
            <button 
              onClick={handleAutoSelect}
              disabled={selected.length === 3}
              className="py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm bg-premium-card border border-premium-border hover:border-premium-accent/50 hover:text-premium-accent transition-colors disabled:opacity-50"
            >
              <Wand2 size={16} /> Chọn tự động
            </button>
          </div>

          <button 
            onClick={continueToPreview}
            disabled={selected.length !== 3 || saving}
            className="w-full py-5 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg text-white bg-premium-primary hover:bg-premium-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:bg-premium-card disabled:text-premium-text-muted disabled:active:scale-100 shadow-[0_10px_40px_rgba(124,58,237,0.3)]"
          >
            {saving ? (
              <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                Tiếp tục <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
