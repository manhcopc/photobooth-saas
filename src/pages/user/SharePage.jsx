import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Download, CheckCircle, Smartphone, HelpCircle } from 'lucide-react'
import { VideoRecapPreview } from '../../components/VideoRecapPreview'

export function SharePage() {
  const { sessionId } = useParams()
  const [sessionData, setSessionData] = useState(null)
  const [frameData, setFrameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/sessions?page=1&limit=100`)
        if (response.ok) {
          const data = await response.json()
          const session = data.data?.find(s => s.saasSessionId === sessionId || s.id === sessionId)
          if (session) {
            setSessionData(session)
            
            const finalOutputsRes = await fetch(`http://localhost:4000/api/admin/final-outputs?page=1&limit=100`)
            if (finalOutputsRes.ok) {
              const finalOutputsData = await finalOutputsRes.json()
              const finalOutput = finalOutputsData.data?.find(f => f.session_id === sessionId || f.sessionId === sessionId)
              if (finalOutput && finalOutput.event_id) {
                const { getEventById } = await import('../../services/eventStorage')
                const { getFramesWithLegacyFallback } = await import('../../services/eventFrameService')
                const event = await getEventById(finalOutput.event_id)
                if (event) {
                  const frames = await getFramesWithLegacyFallback(event)
                  const matchingFrame = frames.find(f => f.id === session.selectedFrame) || frames[0]
                  setFrameData(matchingFrame)
                }
              }
            }
          } else {
            setError('Không tìm thấy phiên chụp')
          }
        }
      } catch (e) {
        console.error('Failed to fetch session', e)
        setError('Lỗi kết nối')
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [sessionId])

  const downloadFile = async (url) => {
    if (!url) return
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      const isVideo = url.includes('.mp4') || url.includes('.webm') || blob.type.includes('video')
      link.download = `photobooth-${Date.now()}${isVideo ? '.mp4' : '.webp'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Failed to download file:', error)
      const link = document.createElement('a')
      link.href = url
      link.download = 'photobooth-file'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const recapVideo = useMemo(() => {
    return (sessionData?.medias || []).find(m => m.type === 'VIDEO_RECAP')
  }, [sessionData])

  if (loading) return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700">Đang tải dữ liệu...</div>
  if (!sessionData) return <div className="grid min-h-svh place-items-center p-6 font-bold text-red-500">{error || 'Không tìm thấy dữ liệu phiên chụp.'}</div>

  const medias = sessionData.medias || []
  const finalImage = medias.find(m => m.type === 'PROCESSED')?.url
  const originalPhotos = medias.filter(m => m.type === 'ORIGINAL').map(m => m.url)
  const videoClips = medias.filter(m => m.type === 'VIDEO').map(m => m.url)

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
