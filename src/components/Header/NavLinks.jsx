import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn.js'

export const NavLinks = ({ links, mobile = false }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavClick = (e, href) => {
    // Nếu là link chuyển hướng bình thường (như /shop) không có hash
    if (href.startsWith('/') && !href.includes('#')) {
      e.preventDefault()
      navigate(href)
      return
    }

    // Tách phần hash (ví dụ: 'new-arrivals' từ '/#new-arrivals' hoặc '#new-arrivals')
    const hashIndex = href.indexOf('#')
    if (hashIndex !== -1) {
      e.preventDefault()
      const targetHash = href.substring(hashIndex + 1)

      if (location.pathname === '/') {
        // Đang ở trang chủ: cuộn mượt mà đến section tương ứng
        const element = document.getElementById(targetHash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        // Đang ở trang khác: lưu lại vị trí cuộn và điều hướng về trang chủ '/'
        sessionStorage.setItem('scrollTarget', targetHash)
        navigate('/')
      }
    }
  }

  return (
    <nav
      className={cn(
        mobile
          ? 'flex flex-col space-y-4 px-4 py-6'
          : 'hidden md:flex items-center space-x-8'
      )}
    >
      {links.map(link => (
        <a
          key={link.label}
          href={link.href}
          onClick={(e) => handleNavClick(e, link.href)}
          className={cn(
            'font-medium transition-colors hover:text-brand-blush cursor-pointer',
            mobile ? 'text-base block' : 'text-sm uppercase tracking-wider'
          )}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}
