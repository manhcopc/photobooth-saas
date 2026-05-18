import { useEffect, useState } from 'react'
import { readStorage, writeStorage } from '../utils/storage'

export const useIndexedDBStorage = (key, initialValue) => {
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadValue = async () => {
      const storedValue = await readStorage(key, initialValue)
      if (!mounted) return
      setValue(storedValue)
      setLoading(false)
    }

    loadValue()

    return () => {
      mounted = false
    }
  }, [initialValue, key])

  useEffect(() => {
    if (!loading) writeStorage(key, value)
  }, [key, loading, value])

  return [value, setValue, loading]
}
