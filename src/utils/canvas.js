import { getPhotoSrc } from './photoItems'

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Missing image source'))
      return
    }
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

const safeLoadImage = async (src) => {
  if (!src) return null
  try {
    return await loadImage(src)
  } catch {
    return null
  }
}

const roundedRect = (context, x, y, width, height, radius) => {
  context.beginPath()
  if (radius > 0) {
    context.moveTo(x + radius, y)
    context.arcTo(x + width, y, x + width, y + height, radius)
    context.arcTo(x + width, y + height, x, y + height, radius)
    context.arcTo(x, y + height, x, y, radius)
    context.arcTo(x, y, x + width, y, radius)
  } else {
    context.rect(x, y, width, height)
  }
  context.closePath()
}

export const drawImageCover = (context, image, slot) => {
  const imageRatio = image.width / image.height
  const slotRatio = slot.width / slot.height
  const sourceWidth = imageRatio > slotRatio ? image.height * slotRatio : image.width
  const sourceHeight = imageRatio > slotRatio ? image.height : image.width / slotRatio
  const sourceX = (image.width - sourceWidth) / 2
  const sourceY = (image.height - sourceHeight) / 2

  context.save()
  roundedRect(context, slot.x, slot.y, slot.width, slot.height, 0)
  context.clip()
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, slot.x, slot.y, slot.width, slot.height)
  context.restore()
}

const normalizeCompositionConfig = (frameOrLayout) => {
  const layoutConfig = frameOrLayout?.layoutConfig || frameOrLayout
  const canvasWidth = layoutConfig?.canvas?.width || layoutConfig?.outputWidth || 1200
  const canvasHeight = layoutConfig?.canvas?.height || layoutConfig?.outputHeight || 1800
  const overlayUrl = frameOrLayout?.overlayUrl || frameOrLayout?.overlay_url || frameOrLayout?.frameUrl || frameOrLayout?.frame_url || layoutConfig?.overlaySrc
  const backgroundUrl = frameOrLayout?.backgroundUrl || frameOrLayout?.background_url || layoutConfig?.backgroundUrl || layoutConfig?.background_url
  const renderMode = frameOrLayout?.renderMode || frameOrLayout?.render_mode || 'overlay_only'

  return {
    ...layoutConfig,
    outputWidth: canvasWidth,
    outputHeight: canvasHeight,
    canvas: { width: canvasWidth, height: canvasHeight },
    overlaySrc: overlayUrl,
    backgroundUrl,
    renderMode,
  }
}

export const composeFinalCanvas = async (photos, frameOrLayout, options = {}) => {
  const layoutConfig = normalizeCompositionConfig(frameOrLayout)
  const canvas = document.createElement('canvas')
  canvas.width = layoutConfig.outputWidth
  canvas.height = layoutConfig.outputHeight
  const context = canvas.getContext('2d')

  context.fillStyle = layoutConfig.background || '#fff7fb'
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (layoutConfig.renderMode === 'background_overlay') {
    const background = await safeLoadImage(layoutConfig.backgroundUrl)
    if (background) context.drawImage(background, 0, 0, canvas.width, canvas.height)
  }

  const images = await Promise.all(photos.map((photo) => loadImage(getPhotoSrc(photo))))
  images.forEach((image, index) => {
    const slot = layoutConfig.slots?.[index]
    if (slot) drawImageCover(context, image, slot)
  })

  const overlay = await safeLoadImage(layoutConfig.overlaySrc)
  if (overlay) context.drawImage(overlay, 0, 0, canvas.width, canvas.height)

  if (options.message && layoutConfig.textBox) {
    const tb = layoutConfig.textBox;
    context.fillStyle = tb.color || '#000000'
    context.font = `${tb.fontSize || 40}px ${tb.fontFamily || 'Arial'}`
    context.textAlign = tb.align || 'center'
    context.textBaseline = 'middle'
    
    let textX = tb.x;
    if (context.textAlign === 'center') textX += tb.width / 2;
    if (context.textAlign === 'right') textX += tb.width;
    
    context.fillText(options.message, textX, tb.y + tb.height / 2)
  }

  return canvas
}

export const composeFinalImage = async (photos, frameOrLayout, options = {}) => {
  const canvas = await composeFinalCanvas(photos, frameOrLayout, options)
  const dataUrl = canvas.toDataURL('image/png')
  canvas.width = 0
  canvas.height = 0
  return dataUrl
}


