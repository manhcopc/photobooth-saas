import React, { useEffect, useRef } from 'react'

export function VideoRecapPreview({ videos, frameOrLayout, className = '' }) {
  const containerRef = useRef(null)

  const layoutConfig = frameOrLayout?.layoutConfig || frameOrLayout
  const canvasWidth = layoutConfig?.canvas?.width || layoutConfig?.outputWidth || 1200
  const canvasHeight = layoutConfig?.canvas?.height || layoutConfig?.outputHeight || 1800
  
  const backgroundUrl = frameOrLayout?.backgroundUrl || frameOrLayout?.background_url || layoutConfig?.backgroundUrl || layoutConfig?.background_url
  const overlayUrl = frameOrLayout?.overlayUrl || frameOrLayout?.overlay_url || frameOrLayout?.frameUrl || frameOrLayout?.frame_url || layoutConfig?.overlaySrc
  
  const renderMode = frameOrLayout?.renderMode || frameOrLayout?.render_mode || 'overlay_only'

  useEffect(() => {
    // Attempt to sync playback
    if (!containerRef.current) return
    const videoElements = Array.from(containerRef.current.querySelectorAll('video'))
    videoElements.forEach(v => {
      v.currentTime = 0
      v.play().catch(() => {})
    })
  }, [videos])

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`} 
      style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }}
    >
      {/* Background layer */}
      <div 
        className="absolute inset-0 w-full h-full bg-[#fff7fb]"
        style={{
          backgroundImage: renderMode === 'background_overlay' && backgroundUrl ? `url(${backgroundUrl})` : 'none',
          backgroundSize: 'cover'
        }}
      />

      {/* Videos layer */}
      {layoutConfig?.slots?.map((slot, index) => {
        const video = videos[index]
        if (!video) return null

        const videoUrl = typeof video === 'string' ? video : URL.createObjectURL(video)

        // Calculate percentages based on layout config
        const left = (slot.x / canvasWidth) * 100
        const top = (slot.y / canvasHeight) * 100
        const width = (slot.width / canvasWidth) * 100
        const height = (slot.height / canvasHeight) * 100

        return (
          <div 
            key={index}
            className="absolute"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
              borderRadius: slot.radius ? `${(slot.radius / canvasWidth) * 100}%` : '0',
              overflow: 'hidden'
            }}
          >
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )
      })}

      {/* Overlay layer */}
      {overlayUrl && (
        <img 
          src={overlayUrl} 
          alt="Frame Overlay" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}
    </div>
  )
}
