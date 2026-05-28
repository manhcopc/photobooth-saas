import { SUPABASE_FRAMES_BUCKET, supabase } from '../lib/supabase'
import { defaultFrameConfig } from '../data/mockEvents'

const TABLE = 'event_frames'

const normalizeLayout = (layout, frameUrl) => {
  const raw = layout || defaultFrameConfig
  const width = raw?.canvas?.width || raw?.outputWidth || defaultFrameConfig.outputWidth
  const height = raw?.canvas?.height || raw?.outputHeight || defaultFrameConfig.outputHeight
  return {
    ...defaultFrameConfig,
    ...raw,
    canvas: { width, height },
    outputWidth: width,
    outputHeight: height,
    overlaySrc: frameUrl || raw?.overlaySrc || defaultFrameConfig.overlaySrc,
  }
}

const normalizeFrame = (frame) => {
  const frameUrl = frame.frame_url || frame.frameUrl
  return {
    id: frame.id,
    eventId: frame.event_id || frame.eventId,
    name: frame.name || 'Frame',
    frameUrl,
    layoutConfig: normalizeLayout(frame.layout_config || frame.layoutConfig, frameUrl),
    previewUrl: frame.preview_url || frame.previewUrl || frameUrl,
    isDefault: Boolean(frame.is_default ?? frame.isDefault),
    isActive: frame.is_active ?? frame.isActive ?? true,
    sortOrder: frame.sort_order ?? frame.sortOrder ?? 0,
    createdAt: frame.created_at || frame.createdAt,
    updatedAt: frame.updated_at || frame.updatedAt,
    isLegacy: false,
  }
}

const toPayload = (payload) => ({
  event_id: payload.eventId,
  name: payload.name,
  frame_url: payload.frameUrl,
  layout_config: normalizeLayout(payload.layoutConfig, payload.frameUrl),
  preview_url: payload.previewUrl || payload.frameUrl,
  is_default: Boolean(payload.isDefault),
  is_active: payload.isActive ?? true,
  sort_order: payload.sortOrder ?? 0,
  updated_at: new Date().toISOString(),
})

export const getFramesByEventId = async (eventId) => {
  const { data } = await supabase.from(TABLE).selectByColumn('event_id', eventId, '*')
  return (Array.isArray(data) ? data : []).map(normalizeFrame).sort((a, b) => a.sortOrder - b.sortOrder)
}

export const getActiveFramesByEventId = async (eventId) => (await getFramesByEventId(eventId)).filter((f) => f.isActive)

export const getFrameById = async (frameId) => {
  const { data } = await supabase.from(TABLE).selectById(frameId, '*')
  return data ? normalizeFrame(data) : null
}

export const createEventFrame = async (payload) => {
  const { data } = await supabase.from(TABLE).insert({ ...toPayload(payload), created_at: new Date().toISOString() })
  return normalizeFrame(Array.isArray(data) ? data[0] : data)
}

export const updateEventFrame = async (frameId, payload) => {
  await supabase.from(TABLE).updateById(frameId, toPayload(payload))
  return getFrameById(frameId)
}

export const deleteEventFrame = async (frameId) => supabase.from(TABLE).deleteById(frameId)

export const setDefaultFrame = async (eventId, frameId) => {
  const frames = await getFramesByEventId(eventId)
  await Promise.all(frames.map((frame) => supabase.from(TABLE).updateById(frame.id, { is_default: frame.id === frameId, updated_at: new Date().toISOString() })))
}

export const getFramesWithLegacyFallback = async (event) => {
  const frames = await getFramesByEventId(event.id)
  if (frames.length > 0) return frames
  return [{
    id: 'legacy-default',
    eventId: event.id,
    name: 'Frame mặc định',
    frameUrl: event.frameUrl || defaultFrameConfig.overlaySrc,
    layoutConfig: normalizeLayout(event.layoutConfig || defaultFrameConfig, event.frameUrl),
    previewUrl: event.frameUrl || defaultFrameConfig.overlaySrc,
    isDefault: true,
    isActive: true,
    isLegacy: true,
    sortOrder: 0,
  }]
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

export const uploadFrameAsset = async ({ eventSlug, file }) => {
  const extension = file.name.split('.').pop() || 'png'
  const path = `events/${eventSlug}/frames/frame-${Date.now()}.${extension}`
  await supabase.storage.from(SUPABASE_FRAMES_BUCKET).upload(path, file, { contentType: file.type || 'image/png', upsert: true })
  return supabase.storage.from(SUPABASE_FRAMES_BUCKET).getPublicUrl(path).data.publicUrl
}
