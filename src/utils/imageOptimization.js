const DEFAULT_WEBP_QUALITY = 0.85

export const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl)
  return response.blob()
}

export const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(blob)
})

export const loadImageFromBlob = (blob) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(blob)
  const image = new Image()

  image.onload = () => {
    URL.revokeObjectURL(objectUrl)
    resolve(image)
  }
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    reject(new Error('Không thể đọc blob ảnh.'))
  }
  image.src = objectUrl
})

const canvasToBlob = (canvas, type = 'image/webp', quality = DEFAULT_WEBP_QUALITY) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) {
      resolve(blob)
      return
    }
    reject(new Error('Không thể export ảnh từ canvas.'))
  }, type, quality)
})

const getContainedSize = ({ width, height, maxWidth, maxHeight }) => {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

export const createWebPBlobFromCanvas = async (canvas, quality = DEFAULT_WEBP_QUALITY) => canvasToBlob(canvas, 'image/webp', quality)

export const resizeImageBlob = async (blob, options = {}) => {
  const {
    maxWidth = 1800,
    maxHeight = 2700,
    quality = DEFAULT_WEBP_QUALITY,
    type = 'image/webp',
  } = options
  const image = await loadImageFromBlob(blob)
  const targetSize = getContainedSize({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height, maxWidth, maxHeight })
  const canvas = document.createElement('canvas')
  canvas.width = targetSize.width
  canvas.height = targetSize.height
  const context = canvas.getContext('2d', { alpha: true })
  context.drawImage(image, 0, 0, targetSize.width, targetSize.height)
  const resizedBlob = await canvasToBlob(canvas, type, quality)
  canvas.width = 0
  canvas.height = 0

  return {
    blob: resizedBlob,
    width: targetSize.width,
    height: targetSize.height,
  }
}

export const createThumbnailBlob = async (blob, options = {}) => {
  const {
    maxWidth = 400,
    quality = 0.75,
    type = 'image/webp',
  } = options
  const image = await loadImageFromBlob(blob)
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const ratio = Math.min(maxWidth / sourceWidth, 1)
  const width = Math.max(1, Math.round(sourceWidth * ratio))
  const height = Math.max(1, Math.round(sourceHeight * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { alpha: true })
  context.drawImage(image, 0, 0, width, height)
  const thumbnailBlob = await canvasToBlob(canvas, type, quality)
  canvas.width = 0
  canvas.height = 0

  return {
    blob: thumbnailBlob,
    width,
    height,
  }
}

export const optimizeFinalCanvas = async (canvas, options = {}) => {
  const {
    maxWidth = 1800,
    maxHeight = 2700,
    quality = DEFAULT_WEBP_QUALITY,
    thumbnailMaxWidth = 400,
    thumbnailQuality = 0.75,
  } = options
  const sourceWidth = canvas.width
  const sourceHeight = canvas.height
  const webpBlob = await createWebPBlobFromCanvas(canvas, quality)
  const finalImage = await resizeImageBlob(webpBlob, { maxWidth, maxHeight, quality, type: 'image/webp' })
  const thumbnail = await createThumbnailBlob(finalImage.blob, { maxWidth: thumbnailMaxWidth, quality: thumbnailQuality, type: 'image/webp' })

  return {
    finalBlob: finalImage.blob,
    thumbnailBlob: thumbnail.blob,
    finalSize: finalImage.blob.size,
    thumbnailSize: thumbnail.blob.size,
    mimeType: finalImage.blob.type || 'image/webp',
    width: finalImage.width,
    height: finalImage.height,
    sourceWidth,
    sourceHeight,
  }
}
