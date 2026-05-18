import localforage from './localforage'

localforage.config({
  name: 'photobooth-saas',
  storeName: 'photobooth_data',
})

export const readStorage = async (key, fallback) => {
  if (typeof window === 'undefined') return fallback

  try {
    const value = await localforage.getItem(key)
    return value ?? fallback
  } catch {
    return fallback
  }
}

export const writeStorage = async (key, value) => {
  if (typeof window === 'undefined') return true

  try {
    await localforage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export const removeStorage = async (key) => {
  if (typeof window === 'undefined') return
  await localforage.removeItem(key)
}
