import { UPLOAD_QUEUE_STATUSES } from '../../services/uploadQueueService'

const LABELS = {
  [UPLOAD_QUEUE_STATUSES.success]: 'Đã đồng bộ',
  [UPLOAD_QUEUE_STATUSES.pending]: 'Đang chờ đồng bộ',
  [UPLOAD_QUEUE_STATUSES.failed]: 'Đồng bộ thất bại',
  [UPLOAD_QUEUE_STATUSES.uploading]: 'Đang upload',
  local_only: 'Local only',
}

const CLASSES = {
  [UPLOAD_QUEUE_STATUSES.success]: 'bg-emerald-50 text-emerald-700',
  [UPLOAD_QUEUE_STATUSES.pending]: 'bg-amber-50 text-amber-700',
  [UPLOAD_QUEUE_STATUSES.failed]: 'bg-red-50 text-red-700',
  [UPLOAD_QUEUE_STATUSES.uploading]: 'bg-purple-50 text-purple-700',
  local_only: 'bg-slate-100 text-slate-700',
}

export function SyncStatusBadge({ status }) {
  const safeStatus = status || UPLOAD_QUEUE_STATUSES.pending

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${CLASSES[safeStatus] || CLASSES[UPLOAD_QUEUE_STATUSES.pending]}`}>
      {LABELS[safeStatus] || LABELS[UPLOAD_QUEUE_STATUSES.pending]}
    </span>
  )
}
