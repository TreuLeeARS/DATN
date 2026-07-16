import { Navigate } from 'react-router-dom'
import { isAdmin, isAdminOrStaff } from '../utils/auth'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export const AdminProtectedRoute = ({ children, adminOnly = false }) => {
  const canAccessAdminArea = isAdminOrStaff()
  const canAccessRoute = canAccessAdminArea && (!adminOnly || isAdmin())

  useEffect(() => {
    if (!canAccessRoute) {
      toast.error('Bạn không có quyền truy cập vào khu vực Quản trị!', {
        id: 'admin-unauthorized-toast',
      })
    }
  }, [canAccessRoute])

  if (!canAccessRoute) {
    return <Navigate to={canAccessAdminArea ? '/admin' : '/'} replace />
  }

  return children
}
