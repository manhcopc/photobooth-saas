import { useEffect, useRef, useState } from 'react'

export const useCamera = (enabled = true) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) return undefined

    let mounted = true

    const startCamera = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Trình duyệt không hỗ trợ camera (getUserMedia). Vui lòng dùng Chrome/Safari bản mới.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1440 } },
          audio: false,
        })
        if (!mounted) return
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch (cameraError) {
        const name = cameraError?.name || ''
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setError('Không thể mở camera. Bạn đã từ chối quyền truy cập camera. Vui lòng bật lại quyền camera trong cài đặt trình duyệt và thử lại.')
          return
        }
        if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
          setError('Không tìm thấy camera khả dụng trên thiết bị này. Vui lòng kiểm tra lại camera và thử lại.')
          return
        }
        setError('Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera trên trình duyệt.')
      }
    }

    startCamera()

    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setReady(false)
    }
  }, [enabled])

  return { videoRef, ready, error }
}
