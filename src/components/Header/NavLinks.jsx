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
          : 'hidden md:flex items-center space-x-2.5 xl:space-x-4'
      )}
    >
      {links.map(link => {
        const hasSublinks = link.sublinks && link.sublinks.length > 0;
        
        return (
          <div key={link.label} className={cn(hasSublinks && !mobile && 'relative group')}>
            <a
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={cn(
                'font-semibold transition-colors hover:text-brand-blush cursor-pointer whitespace-nowrap flex items-center gap-1 py-1.5',
                link.isSale ? 'text-brand-blush' : 'text-brand-charcoal',
                mobile ? 'text-base block' : 'text-[11px] xl:text-xs uppercase tracking-wider'
              )}
            >
              <span>{link.label}</span>
              {hasSublinks && !mobile && (
                <svg className="w-2.5 h-2.5 text-brand-muted group-hover:text-brand-blush transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </a>

            {/* Dropdown Menu for Desktop */}
            {hasSublinks && !mobile && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-44 bg-white border border-gray-100/80 shadow-lg rounded-xl py-2 opacity-0 translate-y-1.5 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                {link.sublinks.map(sub => (
                  <a
                    key={sub.label}
                    href={sub.href}
                    onClick={(e) => handleNavClick(e, sub.href)}
                    className="block px-4 py-1.5 text-[10px] font-bold text-brand-charcoal hover:bg-brand-cream hover:text-brand-blush transition-colors uppercase tracking-wider"
                  >
                    {sub.label}
                  </a>
                ))}
              </div>
            )}

            {/* Sublinks list for Mobile */}
            {hasSublinks && mobile && (
              <div className="flex flex-col pl-4 mt-0.5 border-l border-gray-150 gap-1.5 mb-1.5">
                {link.sublinks.map(sub => (
                  <a
                    key={sub.label}
                    href={sub.href}
                    onClick={(e) => handleNavClick(e, sub.href)}
                    className="text-xs font-semibold text-brand-muted hover:text-brand-charcoal py-0.5 block uppercase tracking-wider"
                  >
                    {sub.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  )
}
