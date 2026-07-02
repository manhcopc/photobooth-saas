import { Camera, RefreshCw, RotateCcw, X, Check, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { EventNotFoundPage } from '../../pages/user/EventNotFoundPage'
import { EventInactivePage } from '../../pages/user/EventInactivePage'

export function DesktopCaptureUI({
  event,
  eventLoading,
  photos,
  countdownSeconds,
  cameraFacing,
  captureOrientation,
  videoRef,
  ready,
  error,
  warning,
  activeFacingMode,
  countdown,
  shooting,
  saving,
  TOTAL_PHOTOS,
  toggleCamera,
  toggleOrientation,
  handleRetake,
  handleFinish,
  handleStart
}) {
  if (eventLoading) {
    return <div className="grid min-h-screen place-items-center bg-premium-bg text-premium-text">Đang tải sự kiện...</div>
  }

  if (!event) return <EventNotFoundPage />
  if (event.status !== 'active') return <EventInactivePage />

  const isPortrait = captureOrientation === 'portrait'
  const controlsDisabled = shooting || saving || countdown !== null

  return (
    <div className="flex h-screen w-full bg-premium-bg text-premium-text overflow-hidden font-sans">
      {/* LEFT PANEL */}
      <div className="w-[300px] border-r border-premium-border bg-premium-surface/50 backdrop-blur-xl p-6 flex flex-col z-10 shadow-2xl">
        <div className="mb-10">
          <h1 className="text-2xl font-black bg-gradient-to-br from-premium-text to-premium-text-muted bg-clip-text text-transparent">Photobooth Pro</h1>
          <p className="text-premium-primary font-medium mt-1">{event.name}</p>
        </div>

        <div className="flex-1 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-premium-text-muted mb-4 uppercase tracking-wider">Cài đặt Camera</h3>
            
            <div className="space-y-3">
              <button 
                onClick={toggleCamera} 
                disabled={controlsDisabled}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-premium-card border border-premium-border hover:border-premium-primary/50 transition-all disabled:opacity-50 disabled:hover:border-premium-border group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-premium-surface group-hover:bg-premium-primary/20 transition-colors">
                    <RefreshCw size={18} className="text-premium-text group-hover:text-premium-primary transition-colors" />
                  </div>
                  <span className="font-semibold text-sm">Đổi Camera</span>
                </div>
                <span className="text-xs text-premium-text-muted">{activeFacingMode === 'environment' ? 'Sau' : 'Trước'}</span>
              </button>

              <button 
                onClick={toggleOrientation} 
                disabled={controlsDisabled}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-premium-card border border-premium-border hover:border-premium-primary/50 transition-all disabled:opacity-50 disabled:hover:border-premium-border group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-premium-surface group-hover:bg-premium-primary/20 transition-colors">
                    <RotateCcw size={18} className="text-premium-text group-hover:text-premium-primary transition-colors" />
                  </div>
                  <span className="font-semibold text-sm">Hướng chụp</span>
                </div>
                <span className="text-xs text-premium-text-muted">{isPortrait ? 'Dọc' : 'Ngang'}</span>
              </button>
            </div>
          </div>
          
          {warning && (
            <div className="p-4 rounded-2xl bg-premium-warning/10 border border-premium-warning/20">
              <p className="text-sm text-premium-warning">{warning}</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 rounded-2xl bg-premium-danger/10 border border-premium-danger/20">
              <p className="text-sm text-premium-danger">{error}</p>
            </div>
          )}
        </div>
        
        <div className="pt-6 border-t border-premium-border">
          <div className="flex items-center justify-between text-xs text-premium-text-muted">
            <span>Phím tắt:</span>
            <div className="flex gap-2">
              <kbd className="px-2 py-1 rounded-md bg-premium-card border border-premium-border">Space</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL */}
      <div className="flex-1 relative flex items-center justify-center p-8 bg-black/20">
        <div className={`relative overflow-hidden rounded-[2rem] shadow-2xl transition-all duration-500 max-h-full max-w-full ${isPortrait ? 'aspect-[9/16] h-[90vh]' : 'aspect-video w-[90%]'}`}>
          <video 
            className={`w-full h-full object-cover ${activeFacingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
            muted 
            playsInline 
            ref={videoRef} 
          />
          
          {/* Countdown Overlay */}
          <AnimatePresence>
            {countdown && (
              <motion.div 
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="absolute inset-0 grid place-items-center z-20"
              >
                <div className="text-[15rem] font-black text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] leading-none">
                  {countdown}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flash Effect */}
          <AnimatePresence>
            {shooting && !countdown && (
              <motion.div 
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 bg-white z-30"
              />
            )}
          </AnimatePresence>
          
          {!ready && !error && (
            <div className="absolute inset-0 grid place-items-center bg-premium-bg/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-premium-border border-t-premium-primary animate-spin" />
                <p className="text-premium-text font-medium">Đang kết nối Camera...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Floating action button centered at bottom */}
        {photos.length < TOTAL_PHOTOS && !shooting && ready && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40">
            <button 
              onClick={handleStart}
              disabled={controlsDisabled}
              className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <div className="w-16 h-16 rounded-full bg-white group-hover:scale-90 transition-transform duration-300" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[340px] border-l border-premium-border bg-premium-surface/50 backdrop-blur-xl p-6 flex flex-col z-10 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold">Thư viện ảnh</h2>
          <div className="px-3 py-1 rounded-full bg-premium-primary/20 text-premium-primary text-sm font-bold">
            {photos.length} / {TOTAL_PHOTOS}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: TOTAL_PHOTOS }).map((_, idx) => (
              <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-premium-card border border-premium-border shadow-inner">
                {photos[idx] ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.4 }}
                    className="w-full h-full"
                  >
                    <img 
                      src={photos[idx].photoDataUrl || photos[idx].imageUrl} 
                      alt={`Photo ${idx + 1}`} 
                      className={`w-full h-full object-cover ${photos[idx].mirror ? 'scale-x-[-1]' : ''}`}
                    />
                  </motion.div>
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-premium-border font-black text-4xl">
                    {idx + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-premium-border mt-auto space-y-3">
          {photos.length > 0 && (
            <button 
              onClick={handleRetake}
              disabled={controlsDisabled}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-premium-text bg-premium-card hover:bg-premium-danger/10 hover:text-premium-danger transition-colors disabled:opacity-50"
            >
              <RotateCcw size={18} /> Chụp lại từ đầu
            </button>
          )}
          
          <button 
            onClick={handleFinish}
            disabled={controlsDisabled || photos.length === 0}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white bg-premium-primary hover:bg-premium-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:bg-premium-card disabled:text-premium-text-muted disabled:active:scale-100 shadow-lg shadow-premium-primary/20"
          >
            {saving ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                Tiếp tục <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
