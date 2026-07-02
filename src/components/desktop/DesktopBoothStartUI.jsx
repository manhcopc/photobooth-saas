import { ArrowRight, Camera, Settings2, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { EventNotFoundPage } from '../../pages/user/EventNotFoundPage'
import { EventInactivePage } from '../../pages/user/EventInactivePage'

export function DesktopBoothStartUI({
  event,
  loading,
  defaultCountdown,
  countdownSeconds,
  setCountdownSeconds,
  frames,
  selectedFrame,
  cameraFacing,
  captureOrientation,
  deviceOrientation,
  selectedCountdownSeconds,
  COUNTDOWN_OPTIONS,
  chooseFrame,
  toggleCamera,
  toggleOrientation,
  prepareSession
}) {
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-premium-bg text-premium-text">
        <div className="w-12 h-12 rounded-full border-4 border-premium-border border-t-premium-primary animate-spin" />
      </div>
    )
  }

  if (!event) return <EventNotFoundPage />
  if (event.status !== 'active') return <EventInactivePage />

  return (
    <div className="flex h-screen w-full bg-premium-bg text-premium-text overflow-hidden font-sans">
      
      {/* LEFT PANEL - TYPOGRAPHY & BRANDING */}
      <div className="flex-1 p-16 flex flex-col justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-premium-primary/10 text-premium-primary font-bold text-sm mb-8 border border-premium-primary/20">
            <Camera size={16} />
            <span>Sẵn sàng ghi lại kỷ niệm</span>
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-black leading-tight tracking-tight mb-6">
            Bắt trọn <br />
            <span className="bg-gradient-to-r from-premium-primary via-premium-secondary to-premium-accent bg-clip-text text-transparent">
              khoảnh khắc
            </span>
          </h1>
          
          <p className="text-xl text-premium-text-muted max-w-lg leading-relaxed">
            {event.name} - {event.description || 'Tham gia cùng chúng tôi để tạo ra những bức ảnh tuyệt vời. Chỉ với vài thao tác đơn giản, bạn sẽ có ngay những kỷ niệm đáng nhớ.'}
          </p>

          <div className="mt-12 flex gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-black text-premium-text">6</span>
              <span className="text-sm font-bold text-premium-text-muted uppercase tracking-widest">Lần chụp</span>
            </div>
            <div className="w-px bg-premium-border" />
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-black text-premium-text">3</span>
              <span className="text-sm font-bold text-premium-text-muted uppercase tracking-widest">Ảnh chọn</span>
            </div>
            <div className="w-px bg-premium-border" />
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-black text-premium-text">1</span>
              <span className="text-sm font-bold text-premium-text-muted uppercase tracking-widest">Khung hình</span>
            </div>
          </div>
        </motion.div>

        {/* Decorative ambient blobs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-premium-primary/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-premium-secondary/10 rounded-full blur-[100px] -z-10" />
      </div>

      {/* RIGHT PANEL - CONTROLS & START BUTTON */}
      <div className="w-[500px] bg-premium-surface/80 backdrop-blur-3xl border-l border-premium-border p-12 flex flex-col justify-center relative z-20 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          {/* Quick Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-premium-text-muted uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={16} /> Cài đặt nhanh
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={toggleCamera}
                className="p-4 rounded-2xl bg-premium-card border border-premium-border hover:border-premium-primary/50 transition-colors text-left group"
              >
                <span className="block text-xs text-premium-text-muted mb-1">Camera</span>
                <span className="block font-bold text-premium-text group-hover:text-premium-primary transition-colors">
                  {cameraFacing === 'environment' ? 'Camera sau' : 'Camera trước'}
                </span>
              </button>
              
              <button 
                onClick={toggleOrientation}
                className="p-4 rounded-2xl bg-premium-card border border-premium-border hover:border-premium-primary/50 transition-colors text-left group"
              >
                <span className="block text-xs text-premium-text-muted mb-1">Hướng chụp</span>
                <span className="block font-bold text-premium-text group-hover:text-premium-primary transition-colors">
                  {captureOrientation === 'landscape' ? 'Chụp ngang' : 'Chụp dọc'}
                </span>
              </button>
            </div>
          </div>

          {/* Countdown Settings */}
          {event.allowUserChangeCountdown && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-premium-text-muted uppercase tracking-widest">
                Đếm ngược (giây)
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {COUNTDOWN_OPTIONS.map((option) => (
                  <button 
                    key={option}
                    onClick={() => setCountdownSeconds(option)}
                    className={`py-3 rounded-xl font-bold transition-all ${
                      selectedCountdownSeconds === option 
                        ? 'bg-premium-primary text-white shadow-lg shadow-premium-primary/30' 
                        : 'bg-premium-card border border-premium-border text-premium-text hover:bg-premium-surface'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Frame Preview Info */}
          {selectedFrame && (
            <div className="p-4 rounded-2xl bg-premium-card border border-premium-border flex gap-4 items-center">
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-premium-surface shrink-0">
                <img 
                  src={selectedFrame.previewUrl || selectedFrame.overlayUrl || selectedFrame.frameUrl} 
                  alt={selectedFrame.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="block text-xs text-premium-primary font-bold mb-1"><ImageIcon size={12} className="inline mr-1"/> Khung ảnh hiện tại</span>
                <span className="block font-bold text-premium-text">{selectedFrame.name}</span>
              </div>
            </div>
          )}

          {/* Start Button */}
          <div className="pt-4">
            <button 
              onClick={prepareSession}
              className="w-full py-6 rounded-3xl flex items-center justify-center gap-3 font-black text-xl text-white bg-premium-primary hover:bg-premium-primary/90 hover:scale-[1.02] transition-all active:scale-95 shadow-[0_20px_60px_rgba(124,58,237,0.4)] group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Camera size={24} className="relative z-10" /> 
              <span className="relative z-10">Bắt Đầu Chụp</span>
              <ArrowRight size={24} className="relative z-10 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>

    </div>
  )
}
