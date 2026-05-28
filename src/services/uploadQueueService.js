import { STORAGE_KEYS } from '../store/keys'
import { readStorage, writeStorage } from '../utils/storage'
import { uploadFinalOutputToSupabase } from './finalOutputService'

export const UPLOAD_QUEUE_STATUSES = {
  pending: 'pending',
  uploading: 'uploading',
  success: 'success',
  failed: 'failed',
}

export const UPLOAD_QUEUE_UPDATED_EVENT = 'photobooth-upload-queue-updated'

const activeUploads = new Set()
let processingQueue = false

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const notifyQueueChanged = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(UPLOAD_QUEUE_UPDATED_EVENT))
}

const readArray = async (key) => {
  const items = await readStorage(key, [])
  return Array.isArray(items) ? items : []
}

const writeQueue = async (queue) => {
  await writeStorage(STORAGE_KEYS.finalUploadQueue, queue)
  notifyQueueChanged()
  return queue
}

const writeLocalOutputs = async (outputs) => {
  await writeStorage(STORAGE_KEYS.finalLocalOutputs, outputs)
  notifyQueueChanged()
  return outputs
}

export const getUploadQueue = async (eventId) => {
  const queue = await readArray(STORAGE_KEYS.finalUploadQueue)
  return eventId ? queue.filter((item) => item.eventId === eventId) : queue
}

export const getLocalFinalOutputs = async (eventId) => {
  const outputs = await readArray(STORAGE_KEYS.finalLocalOutputs)
  return eventId ? outputs.filter((item) => item.eventId === eventId) : outputs
}

const patchQueueItem = async (id, patch) => {
  const queue = await getUploadQueue()
  let updatedItem = null
  const nextQueue = queue.map((item) => {
    if (item.id !== id) return item
    updatedItem = {
      ...item,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    return updatedItem
  })
  await writeQueue(nextQueue)
  return updatedItem
}

const patchLocalOutput = async (localOutputId, patch) => {
  const outputs = await getLocalFinalOutputs()
  const nextOutputs = outputs.map((output) => (output.id === localOutputId ? {
    ...output,
    ...patch,
    updatedAt: new Date().toISOString(),
  } : output))
  await writeLocalOutputs(nextOutputs)
}

export const enqueueFinalOutput = async ({ event, sessionId, optimizedImage, selectedFrame }) => {
  const now = new Date().toISOString()
  const localOutputId = createId('local-output')
  const queueItem = {
    id: createId('upload'),
    eventId: event.id,
    eventSlug: event.slug,
    sessionId,
    finalBlob: optimizedImage.finalBlob,
    thumbnailBlob: optimizedImage.thumbnailBlob,
    finalSize: optimizedImage.finalSize,
    thumbnailSize: optimizedImage.thumbnailSize,
    mimeType: optimizedImage.mimeType,
    width: optimizedImage.width,
    height: optimizedImage.height,
    localOutputId,
    selectedFrameId: selectedFrame?.id || null,
    selectedFrameName: selectedFrame?.name || 'Khung mặc định',
    status: UPLOAD_QUEUE_STATUSES.pending,
    retryCount: 0,
    errorMessage: '',
    remoteImageUrl: null,
    remoteThumbnailUrl: null,
    syncStatus: UPLOAD_QUEUE_STATUSES.pending,
    createdAt: now,
    updatedAt: now,
  }
  const localOutput = {
    id: localOutputId,
    eventId: event.id,
    eventSlug: event.slug,
    sessionId,
    finalBlob: optimizedImage.finalBlob,
    thumbnailBlob: optimizedImage.thumbnailBlob,
    finalSize: optimizedImage.finalSize,
    thumbnailSize: optimizedImage.thumbnailSize,
    mimeType: optimizedImage.mimeType,
    width: optimizedImage.width,
    height: optimizedImage.height,
    queueItemId: queueItem.id,
    selectedFrameId: queueItem.selectedFrameId,
    selectedFrameName: queueItem.selectedFrameName,
    status: UPLOAD_QUEUE_STATUSES.pending,
    retryCount: 0,
    errorMessage: '',
    remoteImageUrl: null,
    remoteThumbnailUrl: null,
    syncStatus: UPLOAD_QUEUE_STATUSES.pending,
    createdAt: now,
    updatedAt: now,
  }

  const [queue, outputs] = await Promise.all([getUploadQueue(), getLocalFinalOutputs()])
  await Promise.all([
    writeQueue([queueItem, ...queue]),
    writeLocalOutputs([localOutput, ...outputs]),
  ])

  return queueItem
}

export const uploadQueueItem = async (id) => {
  const queue = await getUploadQueue()
  const queueItem = queue.find((item) => item.id === id)

  if (!queueItem) throw new Error('Không tìm thấy ảnh trong upload queue.')
  if (queueItem.status === UPLOAD_QUEUE_STATUSES.success) return queueItem
  if (activeUploads.has(id) || activeUploads.size > 0 || queueItem.status === UPLOAD_QUEUE_STATUSES.uploading) return queueItem

  activeUploads.add(id)
  const uploadingItem = await patchQueueItem(id, {
    status: UPLOAD_QUEUE_STATUSES.uploading,
    syncStatus: UPLOAD_QUEUE_STATUSES.uploading,
    errorMessage: '',
  })
  await patchLocalOutput(queueItem.localOutputId, {
    status: UPLOAD_QUEUE_STATUSES.uploading,
    syncStatus: UPLOAD_QUEUE_STATUSES.uploading,
    errorMessage: '',
  })

  try {
    const remoteOutput = await uploadFinalOutputToSupabase(uploadingItem)
    const successPatch = {
      status: UPLOAD_QUEUE_STATUSES.success,
      remoteImageUrl: remoteOutput.imageUrl,
      remoteThumbnailUrl: remoteOutput.thumbnailUrl,
      syncStatus: UPLOAD_QUEUE_STATUSES.success,
      errorMessage: '',
    }
    const successItem = await patchQueueItem(id, successPatch)
    await patchLocalOutput(queueItem.localOutputId, successPatch)
    return successItem
  } catch (error) {
    const retryCount = (queueItem.retryCount || 0) + 1
    const failedPatch = {
      status: UPLOAD_QUEUE_STATUSES.failed,
      syncStatus: UPLOAD_QUEUE_STATUSES.failed,
      retryCount,
      errorMessage: error.message || 'Upload thất bại.',
      remoteImageUrl: error.remoteImageUrl || queueItem.remoteImageUrl || null,
      remoteThumbnailUrl: error.remoteThumbnailUrl || queueItem.remoteThumbnailUrl || null,
      finalStoragePath: error.finalStoragePath || queueItem.finalStoragePath,
      thumbnailStoragePath: error.thumbnailStoragePath || queueItem.thumbnailStoragePath,
    }
    const failedItem = await patchQueueItem(id, failedPatch)
    await patchLocalOutput(queueItem.localOutputId, failedPatch)
    return failedItem
  } finally {
    activeUploads.delete(id)
  }
}

export const retryUploadQueueItem = async (id) => {
  const queueItem = await patchQueueItem(id, {
    status: UPLOAD_QUEUE_STATUSES.pending,
    syncStatus: UPLOAD_QUEUE_STATUSES.pending,
    errorMessage: '',
  })
  if (queueItem) {
    await patchLocalOutput(queueItem.localOutputId, {
      status: UPLOAD_QUEUE_STATUSES.pending,
      syncStatus: UPLOAD_QUEUE_STATUSES.pending,
      errorMessage: '',
    })
  }
  return uploadQueueItem(id)
}

const recoverInterruptedUploads = async () => {
  const queue = await getUploadQueue()
  const cutoff = Date.now() - 2 * 60 * 1000
  let changed = false
  const nextQueue = queue.map((item) => {
    if (item.status !== UPLOAD_QUEUE_STATUSES.uploading) return item
    const updatedAt = new Date(item.updatedAt || item.createdAt).getTime()
    if (Number.isNaN(updatedAt) || updatedAt > cutoff || activeUploads.has(item.id)) return item
    changed = true
    return {
      ...item,
      status: UPLOAD_QUEUE_STATUSES.failed,
      syncStatus: UPLOAD_QUEUE_STATUSES.failed,
      errorMessage: 'Upload bị gián đoạn. Vui lòng retry.',
      updatedAt: new Date().toISOString(),
    }
  })

  if (changed) {
    await writeQueue(nextQueue)
    const recoveredItems = nextQueue.filter((item, index) => item !== queue[index])
    await Promise.all(recoveredItems.map((item) => patchLocalOutput(item.localOutputId, {
      status: UPLOAD_QUEUE_STATUSES.failed,
      syncStatus: UPLOAD_QUEUE_STATUSES.failed,
      errorMessage: item.errorMessage,
    })))
  }
  return changed ? nextQueue : queue
}

export const processUploadQueue = async ({ eventId } = {}) => {
  if (processingQueue) return []
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return []

  processingQueue = true
  try {
    await recoverInterruptedUploads()
    const queue = await getUploadQueue(eventId)
    const itemsToUpload = queue
      .filter((item) => [UPLOAD_QUEUE_STATUSES.pending, UPLOAD_QUEUE_STATUSES.failed].includes(item.status))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    const results = []

    for (const item of itemsToUpload) {
      if (activeUploads.has(item.id)) continue
      const result = await uploadQueueItem(item.id)
      results.push(result)
    }

    return results
  } finally {
    processingQueue = false
  }
}
