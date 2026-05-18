import { STORAGE_KEYS } from '../store/keys'
import { readStorage, removeStorage, writeStorage } from '../utils/storage'

const buildSessionKey = (eventId) => `${STORAGE_KEYS.activeSessions}:${eventId}`
const buildCaptureKey = (eventId, sessionId) => `${STORAGE_KEYS.captures}:${eventId}:${sessionId}`
const buildSelectedKey = (eventId, sessionId) => `${STORAGE_KEYS.selectedPhotos}:${eventId}:${sessionId}`

export const createSessionId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const setActiveSession = async ({ eventId, sessionId }) => {
  await writeStorage(buildSessionKey(eventId), sessionId)
  return sessionId
}

export const getActiveSession = async (eventId) => readStorage(buildSessionKey(eventId), null)

export const clearSession = async ({ eventId, sessionId }) => {
  if (!eventId || !sessionId) return
  await Promise.all([
    removeStorage(buildCaptureKey(eventId, sessionId)),
    removeStorage(buildSelectedKey(eventId, sessionId)),
  ])
}

export const startPhotoSession = async (eventId) => {
  const sessionId = createSessionId()
  await setActiveSession({ eventId, sessionId })
  await clearSession({ eventId, sessionId })
  return sessionId
}

export const getCaptures = async ({ eventId, sessionId }) => {
  if (!eventId || !sessionId) return []
  const photos = await readStorage(buildCaptureKey(eventId, sessionId), [])
  return Array.isArray(photos) ? photos : []
}

export const saveCaptures = async ({ eventId, sessionId, photos }) => {
  const safePhotos = Array.isArray(photos) ? photos : []
  await writeStorage(buildCaptureKey(eventId, sessionId), safePhotos)
  return safePhotos
}

export const getSelectedPhotos = async ({ eventId, sessionId }) => {
  if (!eventId || !sessionId) return []
  const photos = await readStorage(buildSelectedKey(eventId, sessionId), [])
  return Array.isArray(photos) ? photos : []
}

export const saveSelectedPhotos = async ({ eventId, sessionId, photos }) => {
  const safePhotos = Array.isArray(photos) ? photos : []
  await writeStorage(buildSelectedKey(eventId, sessionId), safePhotos)
  return safePhotos
}

export const saveFinalImage = async ({ eventId, sessionId, dataUrl }) => {
  const images = await readStorage(STORAGE_KEYS.finalImages, [])
  const safeImages = Array.isArray(images) ? images : []
  const image = {
    id: `img-${Date.now()}`,
    eventId,
    sessionId,
    dataUrl,
    createdAt: new Date().toISOString(),
  }
  await writeStorage(STORAGE_KEYS.finalImages, [image, ...safeImages])
  return image
}

export const getFinalImages = async (eventId) => {
  const images = await readStorage(STORAGE_KEYS.finalImages, [])
  const safeImages = Array.isArray(images) ? images : []
  return eventId ? safeImages.filter((image) => image.eventId === eventId) : safeImages
}
