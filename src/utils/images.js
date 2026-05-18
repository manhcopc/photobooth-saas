export const CAPTURE_IMAGE_TYPE = 'image/jpeg'
export const CAPTURE_IMAGE_QUALITY = 0.72
export const FINAL_IMAGE_TYPE = 'image/jpeg'
export const FINAL_IMAGE_QUALITY = 0.86

const getContainedSize = (width, height, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

export const captureVideoFrame = (video, { maxWidth = 720, maxHeight = 960, mirror = true } = {}) => {
  const sourceWidth = video.videoWidth || 900
  const sourceHeight = video.videoHeight || 1200
  const { width, height } = getContainedSize(sourceWidth, sourceHeight, maxWidth, maxHeight)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (mirror) {
    context.translate(width, 0)
    context.scale(-1, 1)
  }

  context.drawImage(video, 0, 0, width, height)
  return canvas.toDataURL(CAPTURE_IMAGE_TYPE, CAPTURE_IMAGE_QUALITY)
}
