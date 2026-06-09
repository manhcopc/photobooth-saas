import { getPhotoAspectRatio, getPhotoOrientation, getPhotoSrc } from '../../utils/photoItems'

export function PhotoGrid({ photos = [], selected = [], onToggle }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
      {photos.map((photo, index) => {
        const src = getPhotoSrc(photo)
        const orientation = getPhotoOrientation(photo)
        const aspectRatio = getPhotoAspectRatio(photo)
        const isSelected = selected.includes(photo)
        const hasVideo = Boolean(photo?.videoBlob || photo?.videoPreviewUrl)

        return (
          <button
            className={`relative overflow-hidden rounded-3xl border-4 bg-slate-950 transition ${
              isSelected
                ? 'border-pink-500 shadow-lg shadow-pink-100'
                : 'border-white hover:border-purple-200'
            }`}
            key={photo?.id || `${src}-${index}`}
            onClick={() => onToggle(photo)}
            style={{ aspectRatio: `${aspectRatio}` }}
            type="button"
          >
            <img
              alt={`Ảnh đã chụp ${index + 1} (${orientation === 'landscape' ? 'ngang' : 'dọc'})`}
              className="h-full w-full object-contain"
              src={src}
            />
            {hasVideo ? (
              <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white">
                Có video
              </span>
            ) : null}
            <span
              className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-sm font-black ${
                isSelected
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/90 text-purple-700'
              }`}
            >
              {isSelected ? selected.indexOf(photo) + 1 : index + 1}
            </span>
          </button>
        )
      })}
    </div>
  )
}
