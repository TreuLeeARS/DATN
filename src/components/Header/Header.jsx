import { useState, useEffect } from 'react'
import { navLinks } from '../../data/navLinks.js'
import { NavLinks } from './NavLinks.jsx'
import { CartIcon } from './CartIcon.jsx'
import { AuthButtons } from './AuthButtons.jsx'
import { cn } from '../../utils/cn.js'
import categoryApi from '../../api/categoryApi.js'

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [displayLinks, setDisplayLinks] = useState(navLinks)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80)
    }

    window.addEventListener('scroll', handleScroll)
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchHeaderCategories = async () => {
      try {
        const response = await categoryApi.getRootCategories()
        if (response && response.data) {
          const rootCates = response.data

          // Gọi API lấy tiếp các danh mục con cho từng danh mục gốc (Quần áo, Giày & Túi, Phụ kiện, v.v.)
          const dynamicRootLinks = await Promise.all(
            rootCates.map(async (root) => {
              try {
                const subResponse = await categoryApi.getCategoriesByParent(root.id)
                const subs = subResponse && subResponse.data ? subResponse.data : []
                
                // Sắp xếp thứ tự danh mục con (Cấp 2) cho ổn định
                const subOrder = {
                  'áo': 1, 'quần': 2, 'váy & đầm': 3, 'set đồ': 4, 'áo khoác': 5,
                  'giày': 1, 'túi xách': 2
                }
                const sortedSubs = [...subs].sort((a, b) => {
                  const nameA = a.name.toLowerCase().normalize('NFC')
                  const nameB = b.name.toLowerCase().normalize('NFC')
                  const idxA = subOrder[nameA] || 99
                  const idxB = subOrder[nameB] || 99
                  return idxA - idxB
                })

                return {
                  label: root.name,
                  href: root.name.toLowerCase().normalize('NFC') === 'phụ kiện'
                    ? `/shop?category=${encodeURIComponent(root.name)}`
                    : '/shop',
                  sublinks: sortedSubs.map(sub => ({
                    label: sub.name,
                    href: `/shop?category=${encodeURIComponent(sub.name)}`
                  }))
                }
              } catch (err) {
                console.error(`Lỗi khi tải danh mục con của ${root.name}:`, err)
                return {
                  label: root.name,
                  href: '/shop',
                  sublinks: []
                }
              }
            })
          )

          // Sắp xếp thứ tự hiển thị các danh mục gốc chính: Quần áo, Giày & Túi, Phụ kiện
          const rootOrder = ['quần áo', 'giày & túi', 'phụ kiện']
          dynamicRootLinks.sort((a, b) => {
            const nameA = a.label.toLowerCase().normalize('NFC')
            const nameB = b.label.toLowerCase().normalize('NFC')
            const idxA = rootOrder.indexOf(nameA)
            const idxB = rootOrder.indexOf(nameB)
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB)
          })

          const dynamicLinks = [
            { label: 'Trang chủ', href: '/' },
            { label: 'Mới về', href: '/shop?filter=new' },
            ...dynamicRootLinks,
            { label: 'Sale', href: '/shop?filter=sale', isSale: true },
          ]

          setDisplayLinks(dynamicLinks)
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục cho header:', err)
        // Falls back to hardcoded links already in state
      }
    }

    fetchHeaderCategories()
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        isScrolled
          ? 'bg-white shadow-md py-3'
          : 'bg-transparent py-6'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="text-2xl font-display font-bold text-brand-charcoal">
              OUTTA
            </a>
          </div>

          {/* Desktop Navigation */}
          <NavLinks links={displayLinks} mobile={false} />

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <AuthButtons />
            <CartIcon />
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:text-brand-blush transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <NavLinks links={displayLinks} mobile={true} />
        )}
      </div>
    </header>
  )
}

