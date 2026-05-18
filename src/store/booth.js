import { readStorage, removeStorage, writeStorage } from '../utils/storage'
import { STORAGE_KEYS } from './keys'

export const getCaptures = async () => readStorage(STORAGE_KEYS.captures, [])
export const saveCaptures = async (photos) => writeStorage(STORAGE_KEYS.captures, photos)
export const getSelectedPhotos = async () => readStorage(STORAGE_KEYS.selectedPhotos, [])
export const saveSelectedPhotos = async (photos) => writeStorage(STORAGE_KEYS.selectedPhotos, photos)
export const setActiveEventSlug = async (slug) => writeStorage(STORAGE_KEYS.activeEventSlug, slug)
export const getActiveEventSlug = async () => readStorage(STORAGE_KEYS.activeEventSlug, 'pink-party')

export const clearSession = async () => {
  await Promise.all([
    removeStorage(STORAGE_KEYS.captures),
    removeStorage(STORAGE_KEYS.selectedPhotos),
  ])
}

export const saveFinalImage = async ({ eventSlug, dataUrl }) => {
  const images = await readStorage(STORAGE_KEYS.finalImages, [])
  const image = {
    id: `img-${Date.now()}`,
    eventSlug,
    dataUrl,
    createdAt: new Date().toISOString(),
  }
  await writeStorage(STORAGE_KEYS.finalImages, [image, ...(Array.isArray(images) ? images : [])])
  return image
}

export const getFinalImages = async (eventSlug) => {
  const images = await readStorage(STORAGE_KEYS.finalImages, [])
  const safeImages = Array.isArray(images) ? images : []
  return eventSlug ? safeImages.filter((image) => image.eventSlug === eventSlug) : safeImages
}
