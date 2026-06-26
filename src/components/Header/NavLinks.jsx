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
          ? 'flex flex-col space-y-2'
          : 'hidden md:flex items-center space-x-4 xl:space-x-7'
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
                'transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center gap-1 py-2',
                link.isSale ? 'text-red-800' : 'text-brand-charcoal',
                mobile 
                  ? 'text-sm tracking-[0.15em] font-medium uppercase py-2' 
                  : 'text-[10px] xl:text-[11px] uppercase tracking-[0.2em] font-medium hover:text-black hover:opacity-60'
              )}
            >
              <span>{link.label}</span>
              {hasSublinks && !mobile && (
                <svg 
                  className="w-2.5 h-2.5 text-brand-muted group-hover:text-black group-hover:rotate-180 transition-all duration-300" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </a>

            {/* Dropdown Menu for Desktop */}
            {hasSublinks && !mobile && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-52 bg-white/95 backdrop-blur-md border border-black/10 shadow-sm rounded-none py-3 opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 delay-150 group-hover:delay-0 z-50 before:absolute before:content-[''] before:top-[-10px] before:left-0 before:right-0 before:h-[10px]">
                {link.sublinks.map(sub => (
                  <a
                    key={sub.label}
                    href={sub.href}
                    onClick={(e) => handleNavClick(e, sub.href)}
                    className="block px-6 py-2.5 text-[9px] xl:text-[10px] font-medium text-brand-charcoal hover:bg-black/[0.03] hover:text-black transition-colors uppercase tracking-[0.15em]"
                  >
                    {sub.label}
                  </a>
                ))}
              </div>
            )}

            {/* Sublinks list for Mobile */}
            {hasSublinks && mobile && (
              <div className="flex flex-col pl-4 mt-1 border-l border-gray-200 gap-1.5 mb-2">
                {link.sublinks.map(sub => (
                  <a
                    key={sub.label}
                    href={sub.href}
                    onClick={(e) => handleNavClick(e, sub.href)}
                    className="text-xs font-normal text-brand-muted hover:text-brand-charcoal py-1 block uppercase tracking-wider"
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
