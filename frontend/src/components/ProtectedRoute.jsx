import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { isShowcaseMode } from '../config/showcase'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.accessToken)
  const location = useLocation()

  if (isShowcaseMode) {
    return <Outlet />
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
