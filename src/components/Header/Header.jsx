import { useState, useEffect } from 'react'
import { navLinks } from '../../data/navLinks.js'
import { NavLinks } from './NavLinks.jsx'
import { CartIcon } from './CartIcon.jsx'
import { AuthButtons } from './AuthButtons.jsx'
import { cn } from '../../utils/cn.js'
export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80)
    }

    window.addEventListener('scroll', handleScroll)
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const displayLinks = navLinks

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
