import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
export function RequireAuth() {
  const { isAuthenticated, isAdmin, isSeller } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  if (location.pathname.startsWith('/admin') && !isAdmin) return <Navigate to="/home" replace />
  if (location.pathname.startsWith('/seller') && !isSeller) return <Navigate to="/home" replace />
  return <Outlet />
}
