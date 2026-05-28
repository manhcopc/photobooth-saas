import { SUPABASE_FRAMES_BUCKET, supabase } from '../lib/supabase'
import { defaultFrameConfig } from '../data/mockEvents'
import { STORAGE_KEYS } from '../store/keys'
import { readStorage, writeStorage } from '../utils/storage'

const EVENT_COLUMNS = '*'

const normalizeEvent = (event) => {
  if (!event) return null
  const rawLayout = event.layout_config || event.layoutConfig || event.frameConfig || defaultFrameConfig
  const frameUrl = event.frame_url || event.frameUrl || rawLayout?.overlaySrc || defaultFrameConfig.overlaySrc
  const canvasWidth = rawLayout?.canvas?.width || rawLayout?.outputWidth || defaultFrameConfig.outputWidth
  const canvasHeight = rawLayout?.canvas?.height || rawLayout?.outputHeight || defaultFrameConfig.outputHeight
  const layoutConfig = {
    ...defaultFrameConfig,
    ...rawLayout,
    canvas: { width: canvasWidth, height: canvasHeight },
    outputWidth: canvasWidth,
    outputHeight: canvasHeight,
    overlaySrc: frameUrl,
  }

  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    description: event.description || '',
    date: event.event_date || event.date || '',
    eventDate: event.event_date || event.date || '',
    frameUrl,
    layoutConfig,
    status: event.status || 'active',
    defaultCountdownSeconds: Number(event.default_countdown_seconds || event.defaultCountdownSeconds || 5),
    allowUserChangeCountdown: event.allow_user_change_countdown ?? event.allowUserChangeCountdown ?? true,
    createdAt: event.created_at || event.createdAt,
    updatedAt: event.updated_at || event.updatedAt,
  }
}

const toDbPayload = (payload) => {
  const frameUrl = payload.frameUrl || payload.frame_url || payload.layoutConfig?.overlaySrc || defaultFrameConfig.overlaySrc
  const rawLayout = payload.layoutConfig || payload.layout_config || defaultFrameConfig
  const canvasWidth = rawLayout?.canvas?.width || rawLayout?.outputWidth || defaultFrameConfig.outputWidth
  const canvasHeight = rawLayout?.canvas?.height || rawLayout?.outputHeight || defaultFrameConfig.outputHeight
  const layoutConfig = {
    ...defaultFrameConfig,
    ...rawLayout,
    canvas: { width: canvasWidth, height: canvasHeight },
    outputWidth: canvasWidth,
    outputHeight: canvasHeight,
  }
  return {
    name: payload.name,
    slug: payload.slug,
    description: payload.description || '',
    event_date: payload.date || payload.eventDate || payload.event_date || null,
    frame_url: frameUrl,
    layout_config: {
      ...layoutConfig,
      overlaySrc: frameUrl,
    },
    status: payload.status || 'active',
    default_countdown_seconds: Number(payload.defaultCountdownSeconds || payload.default_countdown_seconds || 5),
    allow_user_change_countdown: payload.allowUserChangeCountdown ?? payload.allow_user_change_countdown ?? true,
    updated_at: new Date().toISOString(),
  }
}

const cacheEvents = async (events) => writeStorage(STORAGE_KEYS.events, events)

export const getCachedEvents = async () => {
  const cached = await readStorage(STORAGE_KEYS.events, [])
  return Array.isArray(cached) ? cached : []
}

export const getEvents = async () => {
  const { data } = await supabase.from('events').selectAll(EVENT_COLUMNS)
  const events = Array.isArray(data) ? data.map(normalizeEvent) : []
  await cacheEvents(events)
  return events
}

export const getEventById = async (id) => {
  const { data } = await supabase.from('events').selectById(id, EVENT_COLUMNS)
  return normalizeEvent(data)
}

export const getEventBySlug = async (slug) => {
  const { data } = await supabase.from('events').selectByColumn('slug', slug, EVENT_COLUMNS)
  const event = Array.isArray(data) ? data[0] : data
  const normalized = normalizeEvent(event)
  if (normalized) {
    const cached = await getCachedEvents()
    await cacheEvents([normalized, ...cached.filter((item) => item.id !== normalized.id && item.slug !== normalized.slug)])
  }
  return normalized
}

export const createEvent = async (payload) => {
  const dbPayload = {
    ...toDbPayload(payload),
    created_at: new Date().toISOString(),
  }
  const { data } = await supabase.from('events').insert(dbPayload)
  const event = normalizeEvent(Array.isArray(data) ? data[0] : data)
  const cached = await getCachedEvents()
  await cacheEvents([event, ...cached.filter((item) => item.id !== event.id)])
  return event
}

export const updateEvent = async (id, payload) => {
  await supabase.from('events').updateById(id, toDbPayload(payload))
  const updated = await getEventById(id)
  const cached = await getCachedEvents()
  await cacheEvents([updated, ...cached.filter((item) => item.id !== id)])
  return updated
}

export const deleteEvent = async (id) => {
  await supabase.from('events').deleteById(id)
  const cached = await getCachedEvents()
  await cacheEvents(cached.filter((item) => item.id !== id))
}

export const toggleEventStatus = async (id, status) => {
  await supabase.from('events').updateById(id, { status, updated_at: new Date().toISOString() })
  return getEventById(id)
}

export const uploadEventFrame = async ({ eventSlug, file }) => {
  const extension = file.name.split('.').pop() || 'png'
  const path = `events/${eventSlug}/frames/frame-${Date.now()}.${extension}`
  await supabase.storage.from(SUPABASE_FRAMES_BUCKET).upload(path, file, {
    contentType: file.type || 'image/png',
    upsert: true,
  })
  const { data } = supabase.storage.from(SUPABASE_FRAMES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export const getCachedEventBySlug = async (slug) => {
  const cached = await getCachedEvents()
  return cached.find((event) => event.slug === slug) || null
}
