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
      } catch {
        setError('Không thể mở camera. Vui lòng cấp quyền camera và thử lại.')
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
