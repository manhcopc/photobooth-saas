import { SUPABASE_FRAMES_BUCKET, supabase } from '../lib/supabase'
import { defaultFrameConfig } from '../data/mockEvents'

const TABLE = 'event_frames'
export const FRAME_RENDER_MODES = {
  overlayOnly: 'overlay_only',
  backgroundOverlay: 'background_overlay',
}
export const LEGACY_FRAME_ID = 'legacy-default'

export const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))

export const createDefaultSlots = (width, height) => {
  const marginX = Math.round(width * 0.1)
  const slotWidth = Math.round(width * 0.8)
  const slotHeight = Math.round(height * 0.22)
  const startY = Math.round(height * 0.12)
  const gap = Math.max(24, Math.round((height - startY * 2 - slotHeight * 3) / 2))
  return Array.from({ length: 3 }).map((_, index) => ({
    x: marginX,
    y: startY + index * (slotHeight + gap),
    width: slotWidth,
    height: slotHeight,
    radius: 32,
  }))
}

export const normalizeFrameLayout = (layout, frameUrl) => {
  const raw = layout || defaultFrameConfig
  const width = raw?.canvas?.width || raw?.outputWidth || defaultFrameConfig.outputWidth
  const height = raw?.canvas?.height || raw?.outputHeight || defaultFrameConfig.outputHeight
  const slots = Array.isArray(raw?.slots) && raw.slots.length === 3 ? raw.slots : createDefaultSlots(width, height)
  return {
    ...defaultFrameConfig,
    ...raw,
    canvas: { width, height },
    outputWidth: width,
    outputHeight: height,
    overlaySrc: frameUrl || raw?.overlaySrc || defaultFrameConfig.overlaySrc,
    slots,
  }
}

const normalizeFrame = (frame) => {
  const overlayUrl = frame.overlay_url || frame.overlayUrl || frame.frame_url || frame.frameUrl
  const backgroundUrl = frame.background_url || frame.backgroundUrl || ''
  const renderMode = frame.render_mode || frame.renderMode || FRAME_RENDER_MODES.overlayOnly
  return {
    id: frame.id,
    eventId: frame.event_id || frame.eventId,
    name: frame.name || 'Frame',
    frameUrl: overlayUrl,
    overlayUrl,
    overlay_url: overlayUrl,
    backgroundUrl,
    background_url: backgroundUrl,
    renderMode,
    render_mode: renderMode,
    layoutConfig: normalizeFrameLayout(frame.layout_config || frame.layoutConfig, overlayUrl),
    previewUrl: frame.preview_url || frame.previewUrl || overlayUrl || backgroundUrl,
    isDefault: Boolean(frame.is_default ?? frame.isDefault),
    isActive: frame.is_active ?? frame.isActive ?? true,
    sortOrder: frame.sort_order ?? frame.sortOrder ?? 0,
    createdAt: frame.created_at || frame.createdAt,
    updatedAt: frame.updated_at || frame.updatedAt,
    isLegacy: false,
  }
}

const toPayload = (payload) => {
  const overlayUrl = payload.overlayUrl || payload.overlay_url || payload.frameUrl || payload.frame_url
  const backgroundUrl = payload.backgroundUrl || payload.background_url || ''
  const renderMode = payload.renderMode || payload.render_mode || FRAME_RENDER_MODES.overlayOnly
  return {
    event_id: payload.eventId,
    name: payload.name,
    frame_url: overlayUrl,
    overlay_url: overlayUrl,
    background_url: backgroundUrl || null,
    render_mode: renderMode,
    layout_config: normalizeFrameLayout(payload.layoutConfig, overlayUrl),
    preview_url: payload.previewUrl || overlayUrl || backgroundUrl,
    is_default: Boolean(payload.isDefault),
    is_active: payload.isActive ?? true,
    sort_order: payload.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
  }
}

const sortFrames = (frames) => [...frames].sort((a, b) => {
  const orderA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 0
  const orderB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0
  if (orderA !== orderB) return orderA - orderB
  return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
})

export const getFramesByEventId = async (eventId) => {
  const { data } = await supabase.from(TABLE).selectByColumnOrdered('event_id', eventId, '*', [
    { column: 'sort_order', ascending: true },
    { column: 'created_at', ascending: true },
  ])
  return sortFrames((Array.isArray(data) ? data : []).map(normalizeFrame))
}

export const getActiveFramesByEventId = async (eventId) => (await getFramesByEventId(eventId)).filter((frame) => frame.isActive)

export const getFrameById = async (frameId) => {
  const { data } = await supabase.from(TABLE).selectById(frameId, '*')
  return data ? normalizeFrame(data) : null
}

export const setDefaultFrame = async (eventId, frameId) => {
  const frames = await getFramesByEventId(eventId)
  await Promise.all(frames.map((frame) => supabase.from(TABLE).updateById(frame.id, {
    is_default: frame.id === frameId,
    updated_at: new Date().toISOString(),
  })))
}

export const createEventFrame = async (payload) => {
  const { data } = await supabase.from(TABLE).insert({ ...toPayload(payload), created_at: new Date().toISOString() })
  const frame = normalizeFrame(Array.isArray(data) ? data[0] : data)
  if (payload.isDefault) await setDefaultFrame(payload.eventId, frame.id)
  return payload.isDefault ? { ...frame, isDefault: true } : frame
}

export const updateEventFrame = async (frameId, payload) => {
  await supabase.from(TABLE).updateById(frameId, toPayload(payload))
  if (payload.isDefault) await setDefaultFrame(payload.eventId, frameId)
  return getFrameById(frameId)
}

export const deleteEventFrame = async (frameId) => supabase.from(TABLE).deleteById(frameId)

export const getLegacyFrame = (event) => {
  const overlayUrl = event.frameUrl || defaultFrameConfig.overlaySrc
  return ({
  id: LEGACY_FRAME_ID,
  eventId: event.id,
  name: 'Frame mặc định',
  frameUrl: overlayUrl,
  overlayUrl,
  overlay_url: overlayUrl,
  backgroundUrl: '',
  background_url: '',
  renderMode: FRAME_RENDER_MODES.overlayOnly,
  render_mode: FRAME_RENDER_MODES.overlayOnly,
  layoutConfig: normalizeFrameLayout(event.layoutConfig || defaultFrameConfig, overlayUrl),
  previewUrl: overlayUrl,
  isDefault: true,
  isActive: true,
  isLegacy: true,
  sortOrder: 0,
})
}

export const getFramesWithLegacyFallback = async (event) => {
  const frames = await getFramesByEventId(event.id)
  return frames.length > 0 ? frames : [getLegacyFrame(event)]
}

export const getActiveFramesWithLegacyFallback = async (event) => {
  const frames = await getFramesByEventId(event.id)
  if (frames.length > 0) return frames.filter((frame) => frame.isActive)
  return [getLegacyFrame(event)]
}

export const migrateLegacyFrameToEventFrames = async (event) => {
  const current = await getFramesByEventId(event.id)
  if (current.length > 0) return current
  await createEventFrame({
    eventId: event.id,
    name: 'Frame mặc định',
    frameUrl: event.frameUrl || defaultFrameConfig.overlaySrc,
    layoutConfig: event.layoutConfig || defaultFrameConfig,
    isDefault: true,
    isActive: true,
    sortOrder: 0,
  })
  return getFramesByEventId(event.id)
}

export const uploadFrameAsset = async ({ eventSlug, file, assetType = 'overlay', frameId = 'new' }) => {
  const extension = file.name.split('.').pop() || 'png'
  const safeType = assetType === 'background' ? 'background' : 'overlay'
  const path = `events/${eventSlug}/frames/${frameId}/${safeType}-${Date.now()}.${extension}`
  await supabase.storage.from(SUPABASE_FRAMES_BUCKET).upload(path, file, { contentType: file.type || 'image/png', upsert: true })
  return supabase.storage.from(SUPABASE_FRAMES_BUCKET).getPublicUrl(path).data.publicUrl
}
