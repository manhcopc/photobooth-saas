import { Outlet } from 'react-router-dom'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export function UserShell() {
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  if (isDesktop) {
    return (
      <main className="min-h-screen w-full bg-premium-bg text-premium-text">
        <Outlet />
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,#ffe4f3,transparent_35%),linear-gradient(135deg,#fff7fb,#f5f0ff)] text-slate-900 md:flex md:items-center md:justify-center md:p-8">
      <section className="mx-auto min-h-svh w-full max-w-md overflow-hidden bg-white/80 shadow-2xl shadow-purple-100 backdrop-blur md:min-h-[820px] md:rounded-[2.5rem] md:border md:border-white">
        <Outlet />
      </section>
    </main>
  )
}

export function AdminShell() {
  return (
    <main className="min-h-svh bg-slate-50 text-slate-900">
      <Outlet />
    </main>
  )
}
