import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/events', label: 'Sự kiện' },
  { to: '/admin/events/new', label: 'Tạo event' },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const logout = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

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
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-2xl bg-slate-50 px-3 py-2 font-bold text-slate-600">{user?.email}</span>
          <button className="rounded-2xl bg-slate-950 px-4 py-2 font-bold text-white" onClick={logout} type="button">Đăng xuất</button>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
