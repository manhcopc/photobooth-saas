import { readStorage, removeStorage, writeStorage } from '../utils/storage'
import { STORAGE_KEYS } from './keys'

const MAX_GALLERY_ITEMS = 12

const writeWithGalleryFallback = (key, value) => {
  if (writeStorage(key, value)) return true

  removeStorage(STORAGE_KEYS.finalImages)
  return writeStorage(key, value)
}

export const getCaptures = () => readStorage(STORAGE_KEYS.captures, [])
export const saveCaptures = (photos) => writeWithGalleryFallback(STORAGE_KEYS.captures, photos)
export const getSelectedPhotos = () => readStorage(STORAGE_KEYS.selectedPhotos, [])
export const saveSelectedPhotos = (photos) => writeWithGalleryFallback(STORAGE_KEYS.selectedPhotos, photos)
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
  const nextImages = [image, ...images].slice(0, MAX_GALLERY_ITEMS)

  if (writeStorage(STORAGE_KEYS.finalImages, nextImages)) return image

  writeStorage(STORAGE_KEYS.finalImages, [image])
  return image
}

export const getFinalImages = (eventSlug) => {
  const images = readStorage(STORAGE_KEYS.finalImages, [])
  return eventSlug ? images.filter((image) => image.eventSlug === eventSlug) : images
}
