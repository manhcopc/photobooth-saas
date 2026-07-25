import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

export function useShareLogic() {
  const { sessionId } = useParams()
  const [sessionData, setSessionData] = useState(null)
  const [frameData, setFrameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const apiUrl = import.meta.env.VITE_API_URL

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20; // Thử tối đa 20 lần (60 giây)
    let timeoutId = null;
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/admin/sessions?page=1&limit=100`)
        if (response.ok) {
          const data = await response.json()
          const session = data.data?.find(s => s.saasSessionId === sessionId || s.id === sessionId)
          if (session) {
            if (isMounted) setSessionData(session)
            
            const finalOutputsRes = await fetch(`${apiUrl}/api/admin/final-outputs?page=1&limit=100`)
            if (finalOutputsRes.ok) {
              const finalOutputsData = await finalOutputsRes.json()
              const finalOutput = finalOutputsData.data?.find(f => f.session_id === sessionId || f.sessionId === sessionId)
              if (finalOutput && finalOutput.event_id) {
                const { getEventById } = await import('../services/eventStorage')
                const { getFramesWithLegacyFallback } = await import('../services/eventFrameService')
                const event = await getEventById(finalOutput.event_id)
                if (event) {
                  const frames = await getFramesWithLegacyFallback(event)
                  const matchingFrame = frames.find(f => f.id === session.selectedFrame) || frames[0]
                  if (isMounted) setFrameData(matchingFrame)
                }
              }
            }
            if (isMounted) {
              setLoading(false)
              setError('')
            }
            return // Thành công thì thoát luôn
          }
        }
      } catch (e) {
        console.error('Failed to fetch session', e)
      }

      // Nếu không tìm thấy session (do Kiosk chưa kịp upload xong) hoặc lỗi mạng
      if (retryCount < maxRetries) {
        retryCount++;
        if (isMounted) {
          setError(`Đang đồng bộ dữ liệu từ máy Kiosk... (${retryCount}/${maxRetries})`)
          setLoading(true) // Vẫn giữ trạng thái loading
        }
        timeoutId = setTimeout(fetchSession, 3000) // Đợi 3 giây rồi thử lại
      } else {
        if (isMounted) {
          setError('Không tìm thấy phiên chụp. Quá thời gian chờ đồng bộ.')
          setLoading(false)
        }
      }
    }
    
    fetchSession()

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [sessionId])

  const downloadFile = async (url) => {
    if (!url) return
    
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      
      const isVideo = url.includes('.mp4') || url.includes('.webm') || blob.type.includes('video')
      const fileName = `photobooth-${Date.now()}${isVideo ? '.mp4' : '.jpg'}`
      
      // Try Web Share API first (Best for iOS/Android to save to Photos)
      if (navigator.canShare) {
        const file = new File([blob], fileName, { type: blob.type })
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
            })
            return // Successfully shared/saved
          } catch (shareError) {
            // If user cancelled, just return. Otherwise, fallback to download
            if (shareError.name === 'AbortError') return
          }
        }
      }

      // Fallback to standard download
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
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

  const medias = sessionData?.medias || []
  const finalImage = medias.find(m => m.type === 'PROCESSED')?.url
  const originalPhotos = medias.filter(m => m.type === 'ORIGINAL').map(m => m.url)
  const videoClips = medias.filter(m => m.type === 'VIDEO').map(m => m.url)

  return {
    sessionId,
    sessionData,
    frameData,
    loading,
    error,
    recapVideo,
    medias,
    finalImage,
    originalPhotos,
    videoClips,
    downloadFile
  }
}
