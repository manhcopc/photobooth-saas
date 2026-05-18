import { readStorage, removeStorage, writeStorage } from '../utils/storage'
import { STORAGE_KEYS } from './keys'

export const getCaptures = async () => await readStorage(STORAGE_KEYS.captures, [])
export const saveCaptures = async (photos) => await writeStorage(STORAGE_KEYS.captures, photos)
export const getSelectedPhotos = async () => await readStorage(STORAGE_KEYS.selectedPhotos, [])
export const saveSelectedPhotos = async (photos) => await writeStorage(STORAGE_KEYS.selectedPhotos, photos)
export const setActiveEventSlug = async (slug) => await writeStorage(STORAGE_KEYS.activeEventSlug, slug)
export const getActiveEventSlug = async () => await readStorage(STORAGE_KEYS.activeEventSlug, 'pink-party')

export const clearSession = async () => {
  await removeStorage(STORAGE_KEYS.captures)
  await removeStorage(STORAGE_KEYS.selectedPhotos)
}

export const saveFinalImage = async ({ eventSlug, dataUrl }) => {
  const images = await readStorage(STORAGE_KEYS.finalImages, [])
  const image = {
    id: `img-${Date.now()}`,
    eventSlug,
    dataUrl,
    createdAt: new Date().toISOString(),
  }
  await writeStorage(STORAGE_KEYS.finalImages, [image, ...images])
  return image
}

export const getFinalImages = async (eventSlug) => {
  const images = await readStorage(STORAGE_KEYS.finalImages, [])
  return eventSlug ? images.filter((image) => image.eventSlug === eventSlug) : images
}
