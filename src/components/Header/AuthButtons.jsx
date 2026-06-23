import { useState } from 'react'
import { Link } from 'react-router-dom'
import authApi from '../../api/authApi'

// Auth buttons: account icon (mobile/compact) + Sign In / Sign Up links (desktop)
export const AuthButtons = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem('accessToken')
    const storedUsername = localStorage.getItem('username')
    return !!(token && storedUsername)
  })
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || ''
  })

  const handleLogout = async () => {
    try {
      // Gọi API logout lên backend để thu hồi/xóa Refresh Token trong database
      await authApi.logout()
    } catch (error) {
      console.error('Lỗi khi gọi API logout:', error)
    } finally {
      // Xóa sạch thông tin ở Client và tải lại trang
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('username')
      
      // Reset trạng thái popup ưu đãi để người dùng có thể nhận lại quà tặng khi là khách vãng lai
      localStorage.removeItem('shopPromptDismissedUntil')
      sessionStorage.removeItem('appliedPromoCode')

      setIsLoggedIn(false)
      setUsername('')
      window.location.reload() // Tải lại trang để cập nhật trạng thái xác thực toàn ứng dụng
    }
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center space-x-4">
        {/* Desktop user greeting */}
        <div className="hidden sm:flex items-center space-x-3 text-sm">
          <span className="font-semibold text-brand-charcoal">
            Xin chào, <span className="text-brand-blush">{username}</span>
          </span>
          <span className="text-brand-muted">/</span>
          <button
            onClick={handleLogout}
            className="font-medium tracking-wider uppercase hover:text-brand-blush transition-colors cursor-pointer text-sm"
          >
            Đăng Xuất
          </button>
        </div>

        {/* Mobile: avatar icon with click to logout */}
        <div className="sm:hidden flex items-center space-x-2">
          <span className="text-xs font-semibold text-brand-charcoal max-w-[80px] truncate">
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 hover:text-brand-blush transition-colors"
            aria-label="Đăng xuất"
          >
            {/* Icon Logout */}
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center">
      {/* Desktop: text links */}
      <div className="hidden sm:flex items-center space-x-3 text-sm">
        <Link
          to="/auth"
          state={{ tab: 'login' }}
          className="font-medium tracking-wider uppercase hover:text-brand-blush transition-colors"
        >
          Đăng Nhập
        </Link>
        <span className="text-brand-muted">/</span>
        <Link
          to="/auth"
          state={{ tab: 'register' }}
          className="font-medium tracking-wider uppercase hover:text-brand-blush transition-colors"
        >
          Đăng Ký
        </Link>
      </div>

      {/* Mobile: account icon */}
      <Link
        to="/auth"
        state={{ tab: 'login' }}
        className="sm:hidden p-2 hover:text-brand-blush transition-colors"
        aria-label="Đăng nhập hoặc đăng ký"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </Link>
    </div>
  )
}
