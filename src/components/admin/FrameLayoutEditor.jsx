import { useEffect, useMemo, useRef } from 'react'

const PREVIEW_WIDTH = 360

const drawPlaceholder = (ctx, slot, index) => {
  const gradient = ctx.createLinearGradient(slot.x, slot.y, slot.x + slot.width, slot.y + slot.height)
  gradient.addColorStop(0, '#f9a8d4')
  gradient.addColorStop(1, '#c4b5fd')
  ctx.save()
  ctx.fillStyle = gradient
  ctx.fillRect(slot.x, slot.y, slot.width, slot.height)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`Ảnh ${index + 1}`, slot.x + slot.width / 2, slot.y + slot.height / 2)
  ctx.restore()
}

export function FrameLayoutEditor({ layoutConfig, frameUrl, showMock = true }) {
  const canvasRef = useRef(null)
  const canvasWidth = layoutConfig?.canvas?.width || layoutConfig?.outputWidth || 1200
  const canvasHeight = layoutConfig?.canvas?.height || layoutConfig?.outputHeight || 1800
  const slots = useMemo(() => layoutConfig?.slots || [], [layoutConfig?.slots])
  const scale = useMemo(() => PREVIEW_WIDTH / canvasWidth, [canvasWidth])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = Math.round(canvasWidth * scale)
    canvas.height = Math.round(canvasHeight * scale)
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(scale, scale)
    ctx.fillStyle = layoutConfig?.background || '#fff7fb'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    if (showMock) {
      slots.forEach((slot, index) => drawPlaceholder(ctx, slot, index))
    }

    const drawOverlay = () => {
      slots.forEach((slot, index) => {
        ctx.strokeStyle = '#7c3aed'
        ctx.lineWidth = 6
        ctx.strokeRect(slot.x, slot.y, slot.width, slot.height)
        ctx.fillStyle = 'rgba(124,58,237,0.85)'
        ctx.fillRect(slot.x + 8, slot.y + 8, 90, 34)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 20px sans-serif'
        ctx.fillText(`Ảnh ${index + 1}`, slot.x + 18, slot.y + 31)
      })
      ctx.restore()
    }

    if (frameUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
        drawOverlay()
      }
      img.onerror = () => drawOverlay()
      img.src = frameUrl
      return
    }
    drawOverlay()
  }, [canvasHeight, canvasWidth, frameUrl, layoutConfig?.background, scale, showMock, slots])

  return <canvas className="w-full max-w-[360px] rounded-2xl border border-slate-200 bg-white" ref={canvasRef} />
}

