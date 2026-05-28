import { FINAL_OUTPUTS_TABLE, supabase } from '../lib/supabase'
import { getLocalFinalOutputs, getUploadQueue, UPLOAD_QUEUE_STATUSES } from './uploadQueueService'

const EVENTS_TABLE = 'events'

const toDateValue = (value) => (value ? new Date(value).getTime() : 0)

export const getEventAnalytics = async (eventId) => {
  const [cloudOutputs, localOutputs, queueItems] = await Promise.all([
    supabase.from(FINAL_OUTPUTS_TABLE).selectByEventId(eventId, 'id,created_at,download_count').then(({ data }) => (Array.isArray(data) ? data : [])),
    getLocalFinalOutputs(eventId),
    getUploadQueue(eventId),
  ])

  const totalImages = cloudOutputs.length
  const totalDownloads = cloudOutputs.reduce((sum, item) => sum + Number(item.download_count || 0), 0)
  const latestImageAt = cloudOutputs
    .map((item) => item.created_at)
    .sort((a, b) => toDateValue(b) - toDateValue(a))[0] || null

  const syncedCount = queueItems.filter((item) => item.status === UPLOAD_QUEUE_STATUSES.success).length
  const pendingCount = queueItems.filter((item) => [UPLOAD_QUEUE_STATUSES.pending, UPLOAD_QUEUE_STATUSES.failed, UPLOAD_QUEUE_STATUSES.uploading].includes(item.status)).length
  const localOnlyCount = Math.max(0, localOutputs.length - syncedCount)

  return {
    totalImages,
    totalDownloads,
    latestImageAt,
    syncedCount,
    pendingCount: Math.max(pendingCount, localOnlyCount),
  }
}

export const getRecentOutputs = async (limit = 10) => {
  const { data } = await supabase.from(FINAL_OUTPUTS_TABLE).selectAll('id,event_id,created_at,image_url,download_count')
  return (Array.isArray(data) ? data : [])
    .sort((a, b) => toDateValue(b.created_at) - toDateValue(a.created_at))
    .slice(0, limit)
}

export const getTopEventsByOutputCount = async () => {
  const [eventsRes, outputsRes] = await Promise.all([
    supabase.from(EVENTS_TABLE).selectAll('id,name,slug,status,created_at'),
    supabase.from(FINAL_OUTPUTS_TABLE).selectAll('id,event_id,download_count'),
  ])
  const events = Array.isArray(eventsRes.data) ? eventsRes.data : []
  const outputs = Array.isArray(outputsRes.data) ? outputsRes.data : []

  const byEvent = new Map()
  outputs.forEach((output) => {
    const eventId = output.event_id
    const current = byEvent.get(eventId) || { outputCount: 0, downloadCount: 0 }
    current.outputCount += 1
    current.downloadCount += Number(output.download_count || 0)
    byEvent.set(eventId, current)
  })

  return events
    .map((event) => ({
      id: event.id,
      name: event.name,
      slug: event.slug,
      status: event.status,
      outputCount: byEvent.get(event.id)?.outputCount || 0,
      downloadCount: byEvent.get(event.id)?.downloadCount || 0,
      createdAt: event.created_at,
    }))
    .sort((a, b) => b.outputCount - a.outputCount)
}

export const getDashboardAnalytics = async () => {
  const [eventsRes, outputsRes, topEvents, recentOutputs] = await Promise.all([
    supabase.from(EVENTS_TABLE).selectAll('id,name,slug,status,created_at'),
    supabase.from(FINAL_OUTPUTS_TABLE).selectAll('id,event_id,download_count'),
    getTopEventsByOutputCount(),
    getRecentOutputs(8),
  ])

  const events = Array.isArray(eventsRes.data) ? eventsRes.data : []
  const outputs = Array.isArray(outputsRes.data) ? outputsRes.data : []

  return {
    totalEvents: events.length,
    totalActiveEvents: events.filter((event) => event.status === 'active').length,
    totalFinalImages: outputs.length,
    totalDownloads: outputs.reduce((sum, item) => sum + Number(item.download_count || 0), 0),
    recentEvents: events.sort((a, b) => toDateValue(b.created_at) - toDateValue(a.created_at)).slice(0, 5),
    topEvent: topEvents[0] || null,
    recentOutputs,
  }
}
