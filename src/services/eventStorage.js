import { mockEvents } from '../data/mockEvents'
import { STORAGE_KEYS } from '../store/keys'
import { writeStorage } from '../utils/storage'
import {
  createEvent as createSupabaseEvent,
  getCachedEventBySlug,
  getCachedEvents,
  getEventBySlug as getSupabaseEventBySlug,
  getEvents as getSupabaseEvents,
  updateEvent as updateSupabaseEvent,
} from './eventService'

export const getEvents = async () => {
  try {
    const events = await getSupabaseEvents()
    if (events.length) return events
  } catch {
    // Offline/admin unauthenticated fallback below.
  }

  const cachedEvents = await getCachedEvents()
  if (cachedEvents.length) return cachedEvents

  await writeStorage(STORAGE_KEYS.events, mockEvents)
  return mockEvents
}

export const saveEvents = async (events) => writeStorage(STORAGE_KEYS.events, Array.isArray(events) ? events : [])

export const getEventBySlug = async (slug) => {
  if (!slug) return null
  try {
    const event = await getSupabaseEventBySlug(slug)
    if (event) return event
  } catch {
    // Fall back to IndexedDB cache if Supabase/network is unavailable.
  }
  return getCachedEventBySlug(slug)
}

export const getEventById = async (id) => {
  if (!id) return null
  const events = await getEvents()
  return events.find(e => e.id === id) || null
}

export const createEvent = createSupabaseEvent
export const updateEvent = updateSupabaseEvent
