import { Link } from 'react-router-dom'
import { useCartContext } from '../../context/CartContext.jsx'
import { showAuthToast } from '../../utils/authToast.jsx'

export const CartIcon = () => {
  const { count } = useCartContext()

  const handleCartClick = (e) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      e.preventDefault()
      sessionStorage.setItem('authRedirectUrl', '/cart')
      showAuthToast('Đăng nhập để xem giỏ hàng và thanh toán.')
    }
  }

  return (
    <Link
      to="/cart"
      onClick={handleCartClick}
      className="relative p-2 hover:text-brand-blush transition-colors block"
      aria-label="Shopping cart"
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
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4l1-12z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-brand-blush text-brand-charcoal
                        text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  )
}
