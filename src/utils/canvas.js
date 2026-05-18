const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

const roundedRect = (context, x, y, width, height, radius) => {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}

const drawImageCover = (context, image, slot) => {
  const imageRatio = image.width / image.height
  const slotRatio = slot.width / slot.height
  const sourceWidth = imageRatio > slotRatio ? image.height * slotRatio : image.width
  const sourceHeight = imageRatio > slotRatio ? image.height : image.width / slotRatio
  const sourceX = (image.width - sourceWidth) / 2
  const sourceY = (image.height - sourceHeight) / 2

  context.save()
  roundedRect(context, slot.x, slot.y, slot.width, slot.height, slot.radius || 32)
  context.clip()
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, slot.x, slot.y, slot.width, slot.height)
  context.restore()
}

export const composeFinalCanvas = async (photos, layoutConfig) => {
  const canvas = document.createElement('canvas')
  canvas.width = layoutConfig.outputWidth
  canvas.height = layoutConfig.outputHeight
  const context = canvas.getContext('2d')

  context.fillStyle = layoutConfig.background || '#fff7fb'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const images = await Promise.all(photos.map((photo) => loadImage(photo)))
  images.forEach((image, index) => drawImageCover(context, image, layoutConfig.slots[index]))

  const frame = await loadImage(layoutConfig.overlaySrc)
  context.drawImage(frame, 0, 0, canvas.width, canvas.height)

  return canvas
}

export const composeFinalImage = async (photos, layoutConfig) => {
  const canvas = await composeFinalCanvas(photos, layoutConfig)
  const dataUrl = canvas.toDataURL('image/png')
  canvas.width = 0
  canvas.height = 0
  return dataUrl
}
