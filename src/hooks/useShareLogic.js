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
    const fetchSession = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/admin/sessions?page=1&limit=100`)
        if (response.ok) {
          const data = await response.json()
          const session = data.data?.find(s => s.saasSessionId === sessionId || s.id === sessionId)
          if (session) {
            setSessionData(session)
            
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
