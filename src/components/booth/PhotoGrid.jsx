export function PhotoGrid({ photos, selected = [], onToggle }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map((photo, index) => {
        const isSelected = selected.includes(photo)
        return (
          <button
            className={`relative overflow-hidden rounded-3xl border-4 bg-purple-50 ${isSelected ? 'border-pink-500 shadow-lg shadow-pink-100' : 'border-white'}`}
            key={`${photo}-${index}`}
            onClick={() => onToggle(photo)}
            type="button"
          >
            <img alt={`Ảnh đã chụp ${index + 1}`} className="aspect-[3/4] h-full w-full object-cover" src={photo} />
            <span className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-sm font-black ${isSelected ? 'bg-pink-500 text-white' : 'bg-white/90 text-purple-700'}`}>
              {isSelected ? selected.indexOf(photo) + 1 : index + 1}
            </span>
          </button>
        )
      })}
    </div>
  )
}
