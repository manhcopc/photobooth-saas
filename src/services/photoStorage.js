import { STORAGE_KEYS } from '../store/keys'
import { readStorage, removeStorage, writeStorage } from '../utils/storage'

const buildSessionKey = (eventId) => `${STORAGE_KEYS.activeSessions}:${eventId}`
const buildSessionFrameKey = (eventId, sessionId) => `${STORAGE_KEYS.activeSessions}:${eventId}:${sessionId}:frame`
const buildSessionCountdownKey = (eventId, sessionId) => `${STORAGE_KEYS.activeSessions}:${eventId}:${sessionId}:countdown`
const buildSessionCameraKey = (eventId, sessionId) => `${STORAGE_KEYS.activeSessions}:${eventId}:${sessionId}:camera`
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
    removeStorage(buildSessionFrameKey(eventId, sessionId)),
    removeStorage(buildSessionCountdownKey(eventId, sessionId)),
    removeStorage(buildSessionCameraKey(eventId, sessionId)),
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

export const saveSelectedFrame = async ({ eventId, sessionId, frame }) => {
  if (!eventId || !sessionId) return null
  await writeStorage(buildSessionFrameKey(eventId, sessionId), frame)
  return frame
}

export const getSelectedFrame = async ({ eventId, sessionId }) => {
  if (!eventId || !sessionId) return null
  return readStorage(buildSessionFrameKey(eventId, sessionId), null)
}

export const saveCountdownSeconds = async ({ eventId, sessionId, countdownSeconds }) => {
  if (!eventId || !sessionId) return null
  const safeCountdown = Number(countdownSeconds) || 5
  await writeStorage(buildSessionCountdownKey(eventId, sessionId), safeCountdown)
  return safeCountdown
}

export const getCountdownSeconds = async ({ eventId, sessionId }) => {
  if (!eventId || !sessionId) return null
  return readStorage(buildSessionCountdownKey(eventId, sessionId), null)
}

export const saveCameraSettings = async ({ eventId, sessionId, cameraFacing, captureOrientation }) => {
  if (!eventId || !sessionId) return null
  const settings = {
    cameraFacing: cameraFacing || 'user',
    captureOrientation: captureOrientation || 'portrait',
  }
  await writeStorage(buildSessionCameraKey(eventId, sessionId), settings)
  return settings
}

export const getCameraSettings = async ({ eventId, sessionId }) => {
  if (!eventId || !sessionId) return null
  return readStorage(buildSessionCameraKey(eventId, sessionId), null)
}
