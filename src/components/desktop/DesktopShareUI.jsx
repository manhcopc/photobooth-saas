import { Download, Film, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { VideoRecapPreview } from '../VideoRecapPreview'

export function DesktopShareUI({
  sessionData,
  frameData,
  loading,
  error,
  recapVideo,
  finalImage,
  originalPhotos,
  videoClips,
  downloadFile
}) {
  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-premium-bg gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-premium-border border-t-premium-primary animate-spin" />
        <p className="text-premium-primary font-bold">{error || 'Đang tải dữ liệu...'}</p>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-premium-bg text-premium-danger font-bold text-xl">
        {error || 'Không tìm thấy dữ liệu phiên chụp.'}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-premium-bg text-premium-text font-sans p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black bg-gradient-to-r from-premium-text to-premium-text-muted bg-clip-text text-transparent">Bộ Sưu Tập Của Bạn</h1>
          <p className="text-premium-text-muted mt-2">Lưu giữ và chia sẻ những khoảnh khắc tuyệt vời</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Highlights (Final Image & Recap) */}
          <div className="lg:col-span-5 space-y-8">
            {finalImage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-premium-surface/50 backdrop-blur-xl border border-premium-border p-6 rounded-[2.5rem] shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2"><ImageIcon className="text-premium-primary" /> Ảnh Photobooth</h2>
                  <button 
                    onClick={() => downloadFile(finalImage)}
                    className="p-2 rounded-full bg-premium-card hover:bg-premium-primary/20 hover:text-premium-primary transition-colors"
                    title="Tải về"
                  >
                    <Download size={20} />
                  </button>
                </div>
                <div className="rounded-[1.5rem] overflow-hidden shadow-inner bg-black">
                  <img src={finalImage} alt="Final Photobooth" className="w-full object-contain" />
                </div>
              </motion.div>
            )}

            {(recapVideo || (videoClips.length > 0 && frameData)) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-premium-surface/50 backdrop-blur-xl border border-premium-border p-6 rounded-[2.5rem] shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Film className="text-premium-accent" /> Video Recap</h2>
                  <button 
                    onClick={() => downloadFile(recapVideo ? recapVideo.url : videoClips[0])}
                    className="p-2 rounded-full bg-premium-card hover:bg-premium-accent/20 hover:text-premium-accent transition-colors"
                    title="Tải về"
                  >
                    <Download size={20} />
                  </button>
                </div>
                <div className="rounded-[1.5rem] overflow-hidden shadow-inner bg-black">
                  {recapVideo ? (
                    <video src={recapVideo.url} controls playsInline className="w-full aspect-[2/3] object-cover" />
                  ) : (
                    <VideoRecapPreview videos={videoClips} frameOrLayout={frameData} />
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Grid of Originals and Video Clips */}
          <div className="lg:col-span-7 space-y-12">
            
            {originalPhotos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6 border-b border-premium-border pb-4">
                  <h2 className="text-2xl font-bold">Ảnh Gốc ({originalPhotos.length})</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {originalPhotos.map((url, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * i }}
                      className="group relative rounded-[1.5rem] overflow-hidden bg-premium-card border border-premium-border aspect-[3/4]"
                    >
                      <img src={url} alt={`Original ${i+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button 
                          onClick={() => downloadFile(url)}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-xl"
                        >
                          <Download size={18} /> Tải Xuống
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {videoClips.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6 border-b border-premium-border pb-4">
                  <h2 className="text-2xl font-bold">Video Clips ({videoClips.length})</h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {videoClips.map((url, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * i }}
                      className="relative rounded-[1.5rem] overflow-hidden bg-premium-card border border-premium-border aspect-video group"
                    >
                      <video src={url} controls className="w-full h-full object-cover bg-black" />
                      <div className="absolute top-4 right-4 z-10">
                        <button 
                          onClick={() => downloadFile(url)}
                          className="p-3 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-premium-primary transition-colors shadow-lg"
                          title="Tải Video"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
