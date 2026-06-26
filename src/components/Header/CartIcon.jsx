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
      className="relative p-2 hover:opacity-60 transition-opacity block"
      aria-label="Shopping cart"
    >
      <svg
        className="w-[22px] h-[22px] text-brand-charcoal"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4l1-12z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute top-1 right-1 bg-black text-white
                        text-[8px] font-semibold min-w-[14px] h-[14px] px-1 rounded-full flex items-center justify-center border border-white">
          {count}
        </span>
      )}
    </Link>
  )
}
