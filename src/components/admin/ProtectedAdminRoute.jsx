import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedAdminRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700">Đang kiểm tra đăng nhập...</div>
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/admin/login" />
  }

  return <Outlet />
}
