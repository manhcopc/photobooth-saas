import { drawImageCover } from './canvas'

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

const loadVideo = (src) =>
  new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Missing video source'))
      return
    }
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.onloadedmetadata = () => resolve(video)
    video.onerror = reject
    video.src = src
    video.load()
  })

const safeLoadImage = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null)
      return
    }
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })

export const composeFinalVideo = async (videoBlobs, frameOrLayout, options = {}) => {
  if (!videoBlobs || videoBlobs.length === 0) {
    throw new Error('No videos provided')
  }

  const layoutConfig = normalizeCompositionConfig(frameOrLayout)
  const canvas = document.createElement('canvas')
  canvas.width = layoutConfig.outputWidth
  canvas.height = layoutConfig.outputHeight
  const context = canvas.getContext('2d')

  // Load background and overlay
  const background = layoutConfig.renderMode === 'background_overlay' && layoutConfig.backgroundUrl 
    ? await safeLoadImage(layoutConfig.backgroundUrl) 
    : null
  const overlay = layoutConfig.overlaySrc ? await safeLoadImage(layoutConfig.overlaySrc) : null

  // Load videos
  const videos = await Promise.all(
    videoBlobs.map((blob) => {
      const src = typeof blob === 'string' ? blob : URL.createObjectURL(blob)
      return loadVideo(src).then(v => ({ video: v, url: src }))
    })
  )

  const maxDuration = Math.max(...videos.map(v => v.video.duration || 0))
  if (maxDuration === 0 || !isFinite(maxDuration)) {
    throw new Error('Could not determine video duration')
  }

  return new Promise((resolve, reject) => {
    // Determine supported mime type
    let mimeType = 'video/webm'
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9'
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      mimeType = 'video/webm;codecs=vp8'
    }

    const stream = canvas.captureStream(30) // 30 FPS
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5000000 })
    const chunks = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      // Cleanup
      videos.forEach(v => {
        if (v.url.startsWith('blob:')) URL.revokeObjectURL(v.url)
      })
      const finalBlob = new Blob(chunks, { type: mimeType })
      resolve({ blob: finalBlob, mimeType })
    }

    recorder.onerror = reject

    let animationId
    let startTime

    const drawFrame = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = (timestamp - startTime) / 1000

      // Draw background
      context.fillStyle = layoutConfig.background || '#fff7fb'
      context.fillRect(0, 0, canvas.width, canvas.height)
      if (background) context.drawImage(background, 0, 0, canvas.width, canvas.height)

      // Draw each video
      videos.forEach(({ video }, index) => {
        const slot = layoutConfig.slots?.[index]
        if (slot) {
          // Calculate source coordinates like drawImageCover
          const imageRatio = video.videoWidth / video.videoHeight
          const slotRatio = slot.width / slot.height
          const sourceWidth = imageRatio > slotRatio ? video.videoHeight * slotRatio : video.videoWidth
          const sourceHeight = imageRatio > slotRatio ? video.videoHeight : video.videoWidth / slotRatio
          const sourceX = (video.videoWidth - sourceWidth) / 2
          const sourceY = (video.videoHeight - sourceHeight) / 2

          context.save()
          // Create clipping region for rounded corners
          const radius = slot.radius || 32
          context.beginPath()
          if (context.roundRect) {
            context.roundRect(slot.x, slot.y, slot.width, slot.height, radius)
          } else {
            // Fallback
            context.rect(slot.x, slot.y, slot.width, slot.height)
          }
          context.clip()

          // Draw flipped video
          context.translate(slot.x + slot.width / 2, slot.y + slot.height / 2)
          context.scale(-1, 1)
          context.translate(-(slot.x + slot.width / 2), -(slot.y + slot.height / 2))

          context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, slot.x, slot.y, slot.width, slot.height)
          context.restore()
        }
      })

      // Draw overlay
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

      if (elapsed < maxDuration) {
        animationId = requestAnimationFrame(drawFrame)
      } else {
        recorder.stop()
      }
    }

    // Start everything
    recorder.start()
    videos.forEach(v => v.video.play().catch(() => {}))
    animationId = requestAnimationFrame(drawFrame)
  })
}
