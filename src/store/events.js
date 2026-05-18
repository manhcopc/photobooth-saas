import { mockEvents } from '../data/mockEvents'
import { readStorage, writeStorage } from '../utils/storage'
import { STORAGE_KEYS } from './keys'

export const getEvents = async () => {
  const events = await readStorage(STORAGE_KEYS.events, null)
  if (Array.isArray(events) && events.length) return events
  await writeStorage(STORAGE_KEYS.events, mockEvents)
  return mockEvents
}

export const saveEvents = async (events) => writeStorage(STORAGE_KEYS.events, events)

export const getEventBySlug = async (slug) => {
  const events = await getEvents()
  return events.find((event) => event.slug === slug) || events[0]
}

export const createEvent = async (event) => {
  const events = await getEvents()
  const newEvent = {
    ...event,
    id: `evt-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  const nextEvents = [newEvent, ...events]
  await saveEvents(nextEvents)
  return newEvent
}
