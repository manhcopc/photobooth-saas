import { readStorage, removeStorage, writeStorage } from '../utils/storage'
import { STORAGE_KEYS } from './keys'

export const getCaptures = () => readStorage(STORAGE_KEYS.captures, [])
export const saveCaptures = (photos) => writeStorage(STORAGE_KEYS.captures, photos)
export const getSelectedPhotos = () => readStorage(STORAGE_KEYS.selectedPhotos, [])
export const saveSelectedPhotos = (photos) => writeStorage(STORAGE_KEYS.selectedPhotos, photos)
export const setActiveEventSlug = (slug) => writeStorage(STORAGE_KEYS.activeEventSlug, slug)
export const getActiveEventSlug = () => readStorage(STORAGE_KEYS.activeEventSlug, 'pink-party')

export const clearSession = () => {
  removeStorage(STORAGE_KEYS.captures)
  removeStorage(STORAGE_KEYS.selectedPhotos)
}

export const saveFinalImage = ({ eventSlug, dataUrl }) => {
  const images = readStorage(STORAGE_KEYS.finalImages, [])
  const image = {
    id: `img-${Date.now()}`,
    eventSlug,
    dataUrl,
    createdAt: new Date().toISOString(),
  }
  writeStorage(STORAGE_KEYS.finalImages, [image, ...images])
  return image
}

export const getFinalImages = (eventSlug) => {
  const images = readStorage(STORAGE_KEYS.finalImages, [])
  return eventSlug ? images.filter((image) => image.eventSlug === eventSlug) : images
}
