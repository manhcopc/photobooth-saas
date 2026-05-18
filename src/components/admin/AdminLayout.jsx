import { Link, NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/events', label: 'Sự kiện' },
  { to: '/admin/events/new', label: 'Tạo event' },
]

export function AdminLayout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-7xl flex-col px-4 py-5 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <Link className="text-2xl font-black text-purple-700" to="/admin">Booth Admin</Link>
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => (
            <NavLink className={({ isActive }) => `rounded-2xl px-4 py-2 text-sm font-bold ${isActive ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'}`} key={link.to} to={link.to} end={link.to === '/admin'}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
