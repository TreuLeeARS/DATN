import { useState } from 'react'
import { Link } from 'react-router-dom'
import authApi from '../../api/authApi'
import { isAdminOrStaff } from '../../utils/auth.js'

// Auth buttons: profile icon with hover dropdown (desktop) + vertical layout (drawer mobile)
export const AuthButtons = ({ inDrawer = false, onCloseDrawer }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem('accessToken')
    const storedUsername = localStorage.getItem('username')
    return !!(token && storedUsername)
  })
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || ''
  })

  const handleAuthLinkClick = () => {
    sessionStorage.setItem('authRedirectUrl', window.location.pathname + window.location.search)
    if (onCloseDrawer) onCloseDrawer()
  }

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

      // Xóa giỏ hàng của tài khoản cũ khi đăng xuất
      localStorage.removeItem('pee_cart_items')
      
      // Xóa đường dẫn điều hướng tạm thời để tránh việc đăng nhập lại bằng tài khoản khác bị nhảy vào link cũ
      sessionStorage.removeItem('authRedirectUrl')

      setIsLoggedIn(false)
      setUsername('')
      if (onCloseDrawer) onCloseDrawer()
      
      // Nếu đăng xuất tại trang riêng tư, chuyển hướng về trang chủ thay vì reload tại chỗ
      const privatePaths = ['/my-orders', '/cart', '/admin']
      const isAtPrivatePage = privatePaths.some(path => window.location.pathname.startsWith(path))
      
      if (isAtPrivatePage) {
        window.location.href = '/'
      } else {
        window.location.reload()
      }
    }
  }

  const canAccessAdmin = isAdminOrStaff()

  // ----------------------------------------------------
  // CASE 1: Render inside Mobile Sidebar Drawer
  // ----------------------------------------------------
  if (inDrawer) {
    if (isLoggedIn) {
      return (
        <div className="flex flex-col space-y-4 pt-6 border-t border-gray-100">
          <div className="px-2">
            <p className="text-[9px] tracking-[0.2em] text-brand-muted uppercase">Tài khoản</p>
            <p className="text-sm font-semibold text-brand-charcoal mt-0.5 truncate">{username}</p>
          </div>
          {canAccessAdmin && (
            <Link
              to="/admin"
              onClick={onCloseDrawer}
              className="block px-2 py-1 text-xs tracking-[0.15em] font-semibold text-brand-charcoal uppercase hover:opacity-60 transition-opacity"
            >
              Quản trị
            </Link>
          )}
          <Link
            to="/my-orders"
            onClick={onCloseDrawer}
            className="block px-2 py-1 text-xs tracking-[0.15em] font-medium text-brand-charcoal uppercase hover:opacity-60 transition-opacity"
          >
            Lịch sử mua hàng
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left block px-2 py-1 text-xs tracking-[0.15em] font-semibold text-red-800 uppercase border-t border-gray-100 pt-4 mt-2"
          >
            Đăng Xuất
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col space-y-3 pt-6 border-t border-gray-100">
        <Link
          to="/auth"
          state={{ tab: 'login' }}
          onClick={handleAuthLinkClick}
          className="block px-2 py-1 text-xs font-semibold tracking-[0.15em] uppercase text-brand-charcoal hover:opacity-60 transition-opacity"
        >
          Đăng Nhập
        </Link>
        <Link
          to="/auth"
          state={{ tab: 'register' }}
          onClick={handleAuthLinkClick}
          className="block px-2 py-1 text-xs font-semibold tracking-[0.15em] uppercase text-brand-charcoal hover:opacity-60 transition-opacity"
        >
          Đăng Ký
        </Link>
      </div>
    )
  }

  // ----------------------------------------------------
  // CASE 2: Render inside Desktop Navbar
  // ----------------------------------------------------
  if (isLoggedIn) {
    return (
      <div className="relative group py-2">
        <button className="flex items-center space-x-1 focus:outline-none hover:opacity-60 transition-opacity block">
          <svg
            className="w-[20px] h-[20px] text-brand-charcoal"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>

        {/* Dropdown User Menu */}
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-black/10 shadow-sm rounded-none py-3.5 opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 delay-150 group-hover:delay-0 z-50 before:absolute before:content-[''] before:top-[-10px] before:left-0 before:right-0 before:h-[10px]">
          <div className="px-4 py-2 border-b border-gray-100 mb-2">
            <p className="text-[9px] tracking-wider text-brand-muted uppercase">Tài khoản</p>
            <p className="text-xs font-semibold text-brand-charcoal truncate">{username}</p>
          </div>
          
          {canAccessAdmin && (
            <Link
              to="/admin"
              className="block px-4 py-2 text-[10px] tracking-wider font-semibold text-brand-charcoal hover:bg-black/[0.03] uppercase transition-colors"
            >
              Quản trị
            </Link>
          )}
          
          <Link
            to="/my-orders"
            className="block px-4 py-2 text-[10px] tracking-wider font-medium text-brand-charcoal hover:bg-black/[0.03] uppercase transition-colors"
          >
            Lịch sử mua hàng
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full text-left block px-4 py-2 text-[10px] tracking-wider font-semibold text-red-800 hover:bg-black/[0.03] uppercase transition-colors border-t border-gray-100 mt-2 pt-2"
          >
            Đăng Xuất
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3 text-sm">
      <Link
        to="/auth"
        state={{ tab: 'login' }}
        onClick={handleAuthLinkClick}
        className="text-[10px] xl:text-[11px] font-semibold tracking-[0.15em] uppercase text-brand-charcoal hover:opacity-60 transition-opacity"
      >
        Đăng Nhập
      </Link>
      <span className="text-gray-200">|</span>
      <Link
        to="/auth"
        state={{ tab: 'register' }}
        onClick={handleAuthLinkClick}
        className="text-[10px] xl:text-[11px] font-semibold tracking-[0.15em] uppercase text-brand-charcoal hover:opacity-60 transition-opacity"
      >
        Đăng Ký
      </Link>
    </div>
  )
}
