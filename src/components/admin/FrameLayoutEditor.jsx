import { useEffect, useMemo, useRef } from 'react'
import { FRAME_RENDER_MODES } from '../../services/eventFrameService'

const PREVIEW_WIDTH = 360

const safeLoadImage = (src) => new Promise((resolve) => {
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

const DraggableBox = ({ x, y, width, height, scale, label, color, onChange }) => {
  const handlePointerDown = (e, action) => {
    e.stopPropagation()
    e.preventDefault()
    
    const startX = e.clientX
    const startY = e.clientY
    
    const onPointerMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / scale
      const dy = (moveEvent.clientY - startY) / scale
      
      let newX = x
      let newY = y
      let newW = width
      let newH = height
      
      if (action === 'move') {
        newX += dx
        newY += dy
      } else if (action === 'resize-br') {
        newW = Math.max(20, width + dx)
        newH = Math.max(20, height + dy)
      } else if (action === 'resize-tr') {
        newY += dy
        newW = Math.max(20, width + dx)
        newH = Math.max(20, height - dy)
      } else if (action === 'resize-bl') {
        newX += dx
        newW = Math.max(20, width - dx)
        newH = Math.max(20, height + dy)
      } else if (action === 'resize-tl') {
        newX += dx
        newY += dy
        newW = Math.max(20, width - dx)
        newH = Math.max(20, height - dy)
      }
      
      onChange({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH)
      })
    }
    
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
    
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const scaledX = x * scale
  const scaledY = y * scale
  const scaledW = width * scale
  const scaledH = height * scale

  return (
    <div 
      style={{
        position: 'absolute',
        left: scaledX,
        top: scaledY,
        width: scaledW,
        height: scaledH,
        border: `2px dashed ${color}`,
        cursor: 'move',
        boxSizing: 'border-box',
        backgroundColor: `${color}10`,
        zIndex: 10
      }}
      onPointerDown={(e) => handlePointerDown(e, 'move')}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, 
        backgroundColor: color, color: '#fff', 
        padding: '2px 6px', fontSize: '10px', fontWeight: 'bold'
      }}>
        {label}
      </div>
      
      <div 
        style={{ position: 'absolute', right: -6, bottom: -6, width: 12, height: 12, backgroundColor: '#fff', border: `2px solid ${color}`, borderRadius: '50%', cursor: 'nwse-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-br')}
      />
      <div 
        style={{ position: 'absolute', left: -6, top: -6, width: 12, height: 12, backgroundColor: '#fff', border: `2px solid ${color}`, borderRadius: '50%', cursor: 'nwse-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-tl')}
      />
      <div 
        style={{ position: 'absolute', right: -6, top: -6, width: 12, height: 12, backgroundColor: '#fff', border: `2px solid ${color}`, borderRadius: '50%', cursor: 'nesw-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-tr')}
      />
      <div 
        style={{ position: 'absolute', left: -6, bottom: -6, width: 12, height: 12, backgroundColor: '#fff', border: `2px solid ${color}`, borderRadius: '50%', cursor: 'nesw-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-bl')}
      />
    </div>
  )
}

export function FrameLayoutEditor({ backgroundUrl = '', frameUrl = '', layoutConfig, renderMode = FRAME_RENDER_MODES.overlayOnly, showMock = true, onLayoutChange }) {
  const canvasRef = useRef(null)
  const canvasWidth = layoutConfig?.canvas?.width || layoutConfig?.outputWidth || 1200
  const canvasHeight = layoutConfig?.canvas?.height || layoutConfig?.outputHeight || 1800
  const slots = useMemo(() => layoutConfig?.slots || [], [layoutConfig?.slots])
  const scale = useMemo(() => PREVIEW_WIDTH / canvasWidth, [canvasWidth])

  const handleSlotChange = (index, newRect) => {
    if (!onLayoutChange) return
    const newSlots = [...slots]
    newSlots[index] = { ...newSlots[index], ...newRect }
    onLayoutChange({ ...layoutConfig, slots: newSlots })
  }

  const handleTextBoxChange = (newRect) => {
    if (!onLayoutChange) return
    onLayoutChange({ ...layoutConfig, textBox: { ...layoutConfig.textBox, ...newRect } })
  }

  useEffect(() => {
    let cancelled = false
    const draw = async () => {
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

      if (renderMode === FRAME_RENDER_MODES.backgroundOverlay) {
        const background = await safeLoadImage(backgroundUrl)
        if (cancelled) return
        if (background) ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight)
      }

      if (showMock) slots.forEach((slot, index) => drawPlaceholder(ctx, slot, index))

      const overlay = await safeLoadImage(frameUrl)
      if (cancelled) return
      if (overlay) ctx.drawImage(overlay, 0, 0, canvasWidth, canvasHeight)

      if (layoutConfig?.textBox) {
        const tb = layoutConfig.textBox;
        ctx.fillStyle = tb.color || '#000000'
        ctx.font = `${tb.fontSize || 40}px ${tb.fontFamily || 'Arial'}`
        ctx.textAlign = tb.align || 'center'
        ctx.textBaseline = 'middle'
        
        let textX = tb.x;
        if (ctx.textAlign === 'center') textX += tb.width / 2;
        if (ctx.textAlign === 'right') textX += tb.width;
        
        ctx.fillText('Chữ mẫu', textX, tb.y + tb.height / 2)
      }

      ctx.restore()
    }

    draw()
    return () => { cancelled = true }
  }, [backgroundUrl, canvasHeight, canvasWidth, frameUrl, layoutConfig, renderMode, scale, showMock, slots])

  return (
    <div className="relative w-full max-w-[360px] mx-auto rounded-2xl overflow-hidden border border-slate-200 bg-white" style={{ height: canvasHeight * scale }}>
      <canvas className="absolute inset-0 w-full h-full pointer-events-none" ref={canvasRef} />
      
      {onLayoutChange && slots.map((slot, index) => (
        <DraggableBox
          key={`slot-${index}`}
          x={slot.x}
          y={slot.y}
          width={slot.width}
          height={slot.height}
          scale={scale}
          label={`Ảnh ${index + 1}`}
          color="#7c3aed"
          onChange={(newRect) => handleSlotChange(index, newRect)}
        />
      ))}

      {onLayoutChange && layoutConfig?.textBox && (
        <DraggableBox
          x={layoutConfig.textBox.x}
          y={layoutConfig.textBox.y}
          width={layoutConfig.textBox.width}
          height={layoutConfig.textBox.height}
          scale={scale}
          label="Khung chữ"
          color="#10b981"
          onChange={handleTextBoxChange}
        />
      )}
    </div>
  )
}
