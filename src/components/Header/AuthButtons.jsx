// Auth buttons: account icon (mobile/compact) + Sign In / Sign Up links (desktop)
export const AuthButtons = () => {
  return (
    <div className="flex items-center">
      {/* Desktop: text links */}
      <div className="hidden sm:flex items-center space-x-3 text-sm">
        <a
          href="#login"
          className="font-medium tracking-wider uppercase hover:text-brand-blush transition-colors"
        >
          Đăng Nhập
        </a>
        <span className="text-brand-muted">/</span>
        <a
          href="#register"
          className="font-medium tracking-wider uppercase hover:text-brand-blush transition-colors"
        >
          Đăng Ký
        </a>
      </div>

      {/* Mobile: account icon */}
      <a
        href="#login"
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
      </a>
    </div>
  )
}
