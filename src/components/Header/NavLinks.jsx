import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn.js'

export const NavLinks = ({ links, mobile = false }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedMobileLinks, setExpandedMobileLinks] = useState([])
  const [isDesktopCategoryMenuOpen, setIsDesktopCategoryMenuOpen] = useState(false)

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
          : 'hidden lg:flex items-center space-x-4 xl:space-x-7'
      )}
    >
      {links.map(link => {
        const hasSublinks = link.sublinks && link.sublinks.length > 0;
        const isExpandedOnMobile = expandedMobileLinks.includes(link.label)
        const isOpenCategoryMenu = link.isCategoryMenu && isDesktopCategoryMenuOpen
        
        return (
          <div key={link.label} className={cn(hasSublinks && !mobile && 'relative group')}>
            <div className={cn(mobile && hasSublinks && 'flex items-center justify-between gap-3')}>
              <a
                href={link.href}
                onClick={(e) => {
                  if (link.isMenuIcon) {
                    e.preventDefault()
                    setIsDesktopCategoryMenuOpen((open) => !open)
                    return
                  }
                  handleNavClick(e, link.href)
                }}
                aria-label={link.isMenuIcon ? 'Xem thêm danh mục' : undefined}
                aria-expanded={link.isMenuIcon ? isDesktopCategoryMenuOpen : undefined}
                className={cn(
                  'transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center gap-1 py-2',
                  link.isSale ? 'text-red-800' : 'text-brand-charcoal',
                  mobile
                    ? 'text-sm tracking-[0.15em] font-medium uppercase py-2'
                    : 'text-[10px] xl:text-[11px] uppercase tracking-[0.2em] font-medium hover:text-black hover:opacity-60'
                )}
              >
                {link.isMenuIcon ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                ) : (
                  <span>{link.label}</span>
                )}
                {hasSublinks && !mobile && !link.isMenuIcon && (
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
              {hasSublinks && mobile && (
                <button
                  type="button"
                  onClick={() => setExpandedMobileLinks((current) => (
                    current.includes(link.label)
                      ? current.filter((label) => label !== link.label)
                      : [...current, link.label]
                  ))}
                  aria-label={`Mở danh mục ${link.label}`}
                  aria-expanded={isExpandedOnMobile}
                  className="p-2 text-brand-charcoal"
                >
                  <svg
                    className={cn('h-4 w-4 transition-transform', isExpandedOnMobile && 'rotate-180')}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown Menu for Desktop */}
            {hasSublinks && !mobile && (
              <div className={cn(
                'absolute top-full mt-2 bg-white border border-black/10 shadow-lg rounded-none transition-all duration-200 z-50',
                link.isCategoryMenu
                  ? cn(
                      'right-0 w-56 max-h-[min(28rem,calc(100vh-8rem))] overflow-y-auto py-1',
                      isOpenCategoryMenu ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-1 opacity-0 pointer-events-none'
                    )
                  : "left-1/2 w-52 -translate-x-1/2 py-3 opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto before:absolute before:content-[''] before:-top-2 before:left-0 before:right-0 before:h-2"
              )}>
                {link.isCategoryMenu ? (
                  <div className="divide-y divide-black/5">
                    {link.sublinks.map(category => (
                      <div key={category.label} className="px-5 py-3 hover:bg-brand-cream/50">
                        <a
                          href={category.href}
                          onClick={(e) => {
                            handleNavClick(e, category.href)
                            setIsDesktopCategoryMenuOpen(false)
                          }}
                          className="block text-xs font-semibold text-brand-charcoal hover:opacity-60"
                        >
                          {category.label}
                        </a>
                        {category.sublinks?.length > 0 && (
                          <div className="mt-2 flex flex-col gap-1.5 pl-2">
                            {category.sublinks.map(sub => (
                              <a
                                key={sub.label}
                                href={sub.href}
                                onClick={(e) => {
                                  handleNavClick(e, sub.href)
                                  setIsDesktopCategoryMenuOpen(false)
                                }}
                                className="text-[11px] text-brand-muted hover:text-brand-charcoal"
                              >
                                {sub.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  link.sublinks.map(sub => (
                    <a
                      key={sub.label}
                      href={sub.href}
                      onClick={(e) => handleNavClick(e, sub.href)}
                      className="block px-6 py-2.5 text-[9px] xl:text-[10px] font-medium text-brand-charcoal hover:bg-black/[0.03] hover:text-black transition-colors uppercase tracking-[0.15em]"
                    >
                      {sub.label}
                    </a>
                  ))
                )}
              </div>
            )}

            {/* Sublinks list for Mobile */}
            {hasSublinks && mobile && isExpandedOnMobile && (
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
