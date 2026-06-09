export const CAPTURE_IMAGE_TYPE = 'image/jpeg'
export const CAPTURE_IMAGE_QUALITY = 0.72
export const FINAL_IMAGE_TYPE = 'image/jpeg'
export const FINAL_IMAGE_QUALITY = 0.86

const getCoverSourceRect = (sourceWidth, sourceHeight, targetWidth, targetHeight) => {
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = targetWidth / targetHeight
  const width = sourceRatio > targetRatio ? sourceHeight * targetRatio : sourceWidth
  const height = sourceRatio > targetRatio ? sourceHeight : sourceWidth / targetRatio
  return {
    x: (sourceWidth - width) / 2,
    y: (sourceHeight - height) / 2,
    width,
    height,
  }
}

export const captureVideoFrame = (video, { orientation = 'portrait', mirror = true } = {}) => {
  const sourceWidth = video.videoWidth || (orientation === 'landscape' ? 1280 : 720)
  const sourceHeight = video.videoHeight || (orientation === 'landscape' ? 720 : 1280)
  const width = orientation === 'landscape' ? 1280 : 720
  const height = orientation === 'landscape' ? 720 : 1280
  const source = getCoverSourceRect(sourceWidth, sourceHeight, width, height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (mirror) {
    context.translate(width, 0)
    context.scale(-1, 1)
  }

  context.drawImage(video, source.x, source.y, source.width, source.height, 0, 0, width, height)
  return canvas.toDataURL(CAPTURE_IMAGE_TYPE, CAPTURE_IMAGE_QUALITY)
}
