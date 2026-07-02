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

const captureVideoFrameData = (video, { orientation = 'portrait', mirror = true } = {}) => {
  const width = video.videoWidth || (orientation === 'landscape' ? 1280 : 720)
  const height = video.videoHeight || (orientation === 'landscape' ? 720 : 1280)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (mirror) {
    context.translate(width, 0)
    context.scale(-1, 1)
  }

  context.drawImage(video, 0, 0, width, height)
  return {
    dataUrl: canvas.toDataURL(CAPTURE_IMAGE_TYPE, CAPTURE_IMAGE_QUALITY),
    width,
    height,
    aspectRatio: width / height,
    orientation: width >= height ? 'landscape' : 'portrait',
  }
}

export const captureVideoFrame = (video, options = {}) => captureVideoFrameData(video, options).dataUrl

export const captureVideoFrameItem = (video, { cameraFacing = 'user', captureOrientation = 'portrait', mirror = true } = {}) => {
  const captured = captureVideoFrameData(video, { orientation: captureOrientation, mirror })
  return {
    id: `capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    photoDataUrl: captured.dataUrl,
    width: captured.width,
    height: captured.height,
    aspectRatio: captured.aspectRatio,
    orientation: captured.orientation,
    cameraFacing,
    captureOrientation,
    createdAt: new Date().toISOString(),
  }
}

