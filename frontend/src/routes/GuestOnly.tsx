import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function GuestOnly() {
  const { isAuthenticated, user } = useAuth()
  const [searchParams] = useSearchParams()

  if (isAuthenticated) {
    const next = searchParams.get('next')
    const requested = next && next.startsWith('/') && !next.startsWith('//') ? next : null

    if (user?.roles.includes('admin')) {
      return <Navigate to={requested?.startsWith('/admin') ? requested : '/admin'} replace />
    }

    if (user?.roles.includes('seller')) {
      return <Navigate to={requested?.startsWith('/seller') ? requested : '/home'} replace />
    }

    const safeNext = requested && !requested.startsWith('/admin') && !requested.startsWith('/seller') ? requested : '/home'
    return <Navigate to={safeNext} replace />
  }

  return <Outlet />
}
