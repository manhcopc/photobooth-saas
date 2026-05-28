import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getEventBySlug } from '../services/eventStorage'

export function useCurrentEvent() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadEvent = async () => {
      setLoading(true)
      const storedEvent = await getEventBySlug(slug)
      if (!mounted) return
      setEvent(storedEvent)
      setLoading(false)
    }

    loadEvent()

    return () => {
      mounted = false
    }
  }, [slug])

  return { event, loading, slug }
}
