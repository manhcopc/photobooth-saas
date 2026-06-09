export const getPhotoSrc = (photo) => {
  if (typeof photo === 'string') return photo
  return photo?.photoDataUrl || photo?.dataUrl || photo?.photoPreviewUrl || photo?.imageDataUrl || photo?.url || ''
}

export const getPhotoOrientation = (photo) => {
  if (typeof photo === 'string') return 'portrait'
  if (photo?.orientation) return photo.orientation
  if (photo?.captureOrientation) return photo.captureOrientation
  if (photo?.width && photo?.height) return photo.width >= photo.height ? 'landscape' : 'portrait'
  return 'portrait'
}

export const getPhotoAspectRatio = (photo) => {
  if (typeof photo === 'string') return 9 / 16
  if (photo?.aspectRatio) return Number(photo.aspectRatio)
  if (photo?.width && photo?.height) return Number(photo.width) / Number(photo.height)
  return getPhotoOrientation(photo) === 'landscape' ? 16 / 9 : 9 / 16
}
