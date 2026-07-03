import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getUploadQueue,
  processUploadQueue,
  retryUploadQueueItem,
  UPLOAD_QUEUE_UPDATED_EVENT,
} from '../services/uploadQueueService'

export function useUploadQueue({ eventId } = {}) {
  const [queue, setQueue] = useState([])
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const processingRef = useRef(false)

  const refreshQueue = useCallback(async () => {
    const items = await getUploadQueue(eventId)
    setQueue(items)
    return items
  }, [eventId])

  const processQueue = useCallback(async () => {
    if (processingRef.current) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return

    processingRef.current = true
    try {
      await processUploadQueue({ eventId })
      await refreshQueue()
    } finally {
      processingRef.current = false
    }
  }, [eventId, refreshQueue])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const items = await getUploadQueue(eventId)
      if (!mounted) return
      setQueue(items)
      await processQueue()
    }

    load()

    return () => {
      mounted = false
    }
  }, [eventId, processQueue])

  useEffect(() => {
    const handleQueueUpdated = () => {
      refreshQueue()
    }
    const handleOnline = () => {
      setOnline(true)
      processQueue()
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener(UPLOAD_QUEUE_UPDATED_EVENT, handleQueueUpdated)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Auto-Retry Background: Chạy mỗi phút 1 lần
    const intervalId = setInterval(() => {
      if (typeof navigator === 'undefined' || navigator.onLine !== false) {
        processQueue()
      }
    }, 60000)

    return () => {
      window.removeEventListener(UPLOAD_QUEUE_UPDATED_EVENT, handleQueueUpdated)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId)
    }
  }, [processQueue, refreshQueue])

  const retry = useCallback(async (id) => {
    const result = await retryUploadQueueItem(id)
    await refreshQueue()
    return result
  }, [refreshQueue])

  return {
    queue,
    online,
    refreshQueue,
    processQueue,
    retry,
  }
}
