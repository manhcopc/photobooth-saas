import { mockEvents } from '../data/mockEvents'
import { readStorage, writeStorage } from '../utils/storage'
import { STORAGE_KEYS } from './keys'

export const getEvents = () => {
  const events = readStorage(STORAGE_KEYS.events, null)
  if (events?.length) return events
  writeStorage(STORAGE_KEYS.events, mockEvents)
  return mockEvents
}

export const saveEvents = (events) => writeStorage(STORAGE_KEYS.events, events)

export const getEventBySlug = (slug) => getEvents().find((event) => event.slug === slug) || getEvents()[0]

export const createEvent = (event) => {
  const events = getEvents()
  const newEvent = {
    ...event,
    id: `evt-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  const nextEvents = [newEvent, ...events]
  saveEvents(nextEvents)
  return newEvent
}
