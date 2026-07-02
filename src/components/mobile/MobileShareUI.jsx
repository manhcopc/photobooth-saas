import { Download } from 'lucide-react'
import { VideoRecapPreview } from '../VideoRecapPreview'

export function MobileShareUI({
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
  if (loading) return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700">Đang tải dữ liệu...</div>
  if (!sessionData) return <div className="grid min-h-svh place-items-center p-6 font-bold text-red-500">{error || 'Không tìm thấy dữ liệu phiên chụp.'}</div>

  return (
    <div className="min-h-svh bg-purple-50 p-6 pb-24 md:min-h-[820px]">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-black text-slate-950 text-center mb-6">Gallery Của Bạn</h1>
        
        {(recapVideo || (videoClips.length > 0 && frameData)) && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Video Recap</h2>
            <div className="overflow-hidden rounded-[2rem] bg-white p-3 shadow-sm">
              <div className="rounded-[1.5rem] overflow-hidden bg-slate-100">
                {recapVideo ? (
                  <video src={recapVideo.url} controls playsInline className="w-full aspect-[2/3] object-cover bg-black" />
                ) : (
                  <VideoRecapPreview videos={videoClips} frameOrLayout={frameData} />
                )}
              </div>
              <button 
                onClick={() => downloadFile(recapVideo ? recapVideo.url : videoClips[0])}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-100 py-3 text-sm font-bold text-purple-700 transition-colors hover:bg-purple-200"
              >
                <Download size={18} /> Tải Video Recap
              </button>
            </div>
          </div>
        )}

        {finalImage && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Ảnh Photobooth</h2>
            <div className="overflow-hidden rounded-[2rem] bg-white p-3 shadow-sm">
              <img src={finalImage} alt="Final" className="w-full rounded-[1.5rem] object-cover" />
              <button 
                onClick={() => downloadFile(finalImage)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-100 py-3 text-sm font-bold text-purple-700 transition-colors hover:bg-purple-200"
              >
                <Download size={18} /> Tải ảnh này
              </button>
            </div>
          </div>
        )}

        {videoClips.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Video Clips</h2>
            <div className="grid grid-cols-2 gap-4">
              {videoClips.map((url, i) => (
                <div key={i} className="overflow-hidden rounded-[1.5rem] bg-white p-2 shadow-sm">
                  <video src={url} controls className="w-full rounded-xl object-cover aspect-[2/3] bg-black" />
                  <button 
                    onClick={() => downloadFile(url)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    <Download size={14} /> Tải Video
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {originalPhotos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Ảnh Gốc</h2>
            <div className="grid grid-cols-2 gap-4">
              {originalPhotos.map((url, i) => (
                <div key={i} className="overflow-hidden rounded-[1.5rem] bg-white p-2 shadow-sm">
                  <img src={url} alt={`Original ${i+1}`} className="w-full rounded-xl object-cover aspect-[2/3]" />
                  <button 
                    onClick={() => downloadFile(url)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    <Download size={14} /> Tải Ảnh
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
