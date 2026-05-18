import { mockEvents } from '../data/mockEvents'
import { STORAGE_KEYS } from '../store/keys'
import { readStorage, writeStorage } from '../utils/storage'

const normalizeEvent = (event) => {
  const layoutConfig = event.layoutConfig || event.frameConfig
  const frameUrl = event.frameUrl || layoutConfig?.overlaySrc || '/frames/default-frame.svg'

  return {
    ...event,
    frameUrl,
    layoutConfig: {
      ...layoutConfig,
      overlaySrc: frameUrl,
    },
  }
}

export const getEvents = async () => {
  const storedEvents = await readStorage(STORAGE_KEYS.events, null)
  const events = Array.isArray(storedEvents) && storedEvents.length ? storedEvents : mockEvents
  const normalizedEvents = events.map(normalizeEvent)

  if (!Array.isArray(storedEvents) || !storedEvents.length) {
    await writeStorage(STORAGE_KEYS.events, normalizedEvents)
  }

  return normalizedEvents
}

export const saveEvents = async (events) => {
  const normalizedEvents = Array.isArray(events) ? events.map(normalizeEvent) : []
  await writeStorage(STORAGE_KEYS.events, normalizedEvents)
  return normalizedEvents
}

export const getEventBySlug = async (slug) => {
  if (!slug) return null
  const events = await getEvents()
  return events.find((event) => event.slug === slug) || null
}

export const createEvent = async (event) => {
  const events = await getEvents()
  const layoutConfig = event.layoutConfig || event.frameConfig
  const frameUrl = event.frameUrl || layoutConfig?.overlaySrc || '/frames/default-frame.svg'
  const newEvent = normalizeEvent({
    ...event,
    id: `evt-${Date.now()}`,
    frameUrl,
    layoutConfig: {
      ...layoutConfig,
      overlaySrc: frameUrl,
    },
    createdAt: new Date().toISOString(),
  })
  await saveEvents([newEvent, ...events])
  return newEvent
}
