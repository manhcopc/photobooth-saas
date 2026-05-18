export function BoothHeader({ eyebrow = 'Photobooth', title, description }) {
  return (
    <header className="px-6 pt-8 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-500">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950">{title}</h1>
      {description ? <p className="mx-auto mt-3 max-w-sm text-base leading-7 text-slate-600">{description}</p> : null}
    </header>
  )
}
