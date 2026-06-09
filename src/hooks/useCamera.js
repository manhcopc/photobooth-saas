import { useEffect, useRef, useState } from 'react'

const stopStream = (stream) => stream?.getTracks().forEach((track) => track.stop())

export const useCamera = (enabled = true, { facingMode = 'user', orientation = 'portrait' } = {}) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [ready, setReady] = useState(false)
  const [activeFacingMode, setActiveFacingMode] = useState(facingMode)

  useEffect(() => {
    if (!enabled) return undefined

    let mounted = true

    const openStream = async (requestedFacingMode) => navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: requestedFacingMode },
        width: { ideal: orientation === 'landscape' ? 1280 : 720 },
        height: { ideal: orientation === 'landscape' ? 720 : 1280 },
      },
      audio: false,
    })

    const startCamera = async () => {
      setError('')
      setWarning('')
      setReady(false)
      stopStream(streamRef.current)
      streamRef.current = null

      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Trình duyệt không hỗ trợ camera (getUserMedia). Vui lòng dùng Chrome/Safari bản mới.')
        return
      }

      try {
        let stream
        let actualFacingMode = facingMode
        try {
          stream = await openStream(facingMode)
        } catch (cameraError) {
          if (facingMode === 'environment') {
            stream = await openStream('user')
            actualFacingMode = 'user'
            if (mounted) setWarning('Không tìm thấy camera sau, hệ thống đang dùng camera trước.')
          } else {
            throw cameraError
          }
        }

        if (!mounted) {
          stopStream(stream)
          return
        }

        streamRef.current = stream
        setActiveFacingMode(actualFacingMode)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          if (mounted) setReady(true)
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
      stopStream(streamRef.current)
      streamRef.current = null
      setReady(false)
    }
  }, [enabled, facingMode, orientation])

  return { videoRef, ready, error, warning, activeFacingMode }
}
