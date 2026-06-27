import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import popupApi from '../../api/popupApi'

export const ShopPromptModal = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [show, setShow] = useState(false)
  const modalRef = useRef(null)
  const overlayRef = useRef(null)

  const [popupData, setPopupData] = useState({
    header: 'Ưu Đãi Đặc Biệt 🎁',
    title: 'Tặng bạn món quà nhỏ làm quen!',
    description: 'Tặng ngay mã giảm giá 15% cho đơn hàng đầu tiên của bạn tại OUTTA. Nhận ưu đãi để nâng tầm tủ đồ mùa này nhé.'
  })

  // Tải thông báo popup từ DB nếu có
  useEffect(() => {
    const fetchActivePopup = async () => {
      try {
        const res = await popupApi.getPopups()
        if (res && res.data && res.data.length > 0) {
          // Lấy popup đầu tiên làm đại diện
          const activePopup = res.data[0]
          setPopupData({
            header: activePopup.header || 'Ưu Đãi Đặc Biệt 🎁',
            title: activePopup.title || 'Tặng bạn món quà nhỏ làm quen!',
            description: activePopup.description || 'Tặng ngay mã giảm giá 15% cho đơn hàng đầu tiên của bạn tại OUTTA. Nhận ưu đãi để nâng tầm tủ đồ mùa này nhé.'
          })
        }
      } catch (err) {
        // Bỏ qua lỗi 403 hoặc lỗi mạng và chạy bình thường với fallback mặc định
      }
    }
    fetchActivePopup()
  }, [])

  // Chế độ demo: Chỉ kích hoạt thủ công khi URL có tham số ?demo=true
  const searchParams = new URLSearchParams(location.search)
  const isDemoMode = searchParams.get('demo') === 'true'

  // Phục vụ chạy demo: Nhấn phím tắt Alt + R trên bàn phím để đặt lại trạng thái hiển thị của popup bất kỳ lúc nào
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'r') {
        localStorage.removeItem('shopPromptDismissedUntil')
        sessionStorage.removeItem('appliedPromoCode')
        toast.success('Đã đặt lại trạng thái hiển thị Popup ưu đãi! Trang đang tải lại...', { icon: '🔄' })
        setTimeout(() => {
          window.location.reload()
        }, 1200)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleGetPromo = useCallback(() => {
    sessionStorage.setItem('appliedPromoCode', 'PEESTART15')
    localStorage.setItem('shopPromptDismissedUntil', 'forever')
    
    // Animation đóng và chuyển hướng
    gsap.to(modalRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        setShow(false)
        toast.success('Mã giảm giá PEESTART15 (giảm 15%) đã được áp dụng!', {
          duration: 4000,
          icon: '🎁'
        })
        navigate('/shop')
      }
    })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, delay: 0.1 })
  }, [navigate])

  const handleClose = useCallback(() => {
    // Tạm ẩn trong 24 giờ (1 ngày) để khớp với thông báo hết hạn
    if (!isDemoMode) {
      localStorage.setItem('shopPromptDismissedUntil', String(Date.now() + 24 * 60 * 60 * 1000))
    }

    // Animation đóng modal
    gsap.to(modalRef.current, {
      y: 40,
      scale: 0.95,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => setShow(false)
    })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.4, delay: 0.05 })
    
    toast('Mã ưu đãi 15% của bạn sẽ hết hạn sau 24h. Hãy nhanh tay chọn món đồ ưng ý nhé!', {
      duration: 5000,
      icon: '⏳'
    })
  }, [isDemoMode])

  useEffect(() => {
    // Không hiện ở các trang thanh toán/tài khoản
    const blacklist = ['/cart', '/auth', '/reset-password']
    if (blacklist.includes(location.pathname)) {
      return
    }

    // Nếu không phải chế độ demo, mới kiểm tra các điều kiện chặn
    if (!isDemoMode) {
      const dismissedUntil = localStorage.getItem('shopPromptDismissedUntil')
      const hasPromo = sessionStorage.getItem('appliedPromoCode')
      
      // Nếu khách đã nhận mã hoặc popup đang trong thời gian tạm ẩn
      if (hasPromo || dismissedUntil === 'forever' || (dismissedUntil && Date.now() < Number(dismissedUntil))) {
        return
      }
    }

    let timeSpentMet = false
    let scrollMet = false

    const checkTrigger = () => {
      if (timeSpentMet && scrollMet) {
        setShow(true)
        window.removeEventListener('scroll', handleScroll)
      }
    }

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) {
        scrollMet = true
        checkTrigger()
        return
      }
      const scrolled = (window.scrollY / docHeight) * 100
      if (scrolled >= 50) {
        scrollMet = true
        checkTrigger()
      }
    }

    // Đợi 10 giây (hoặc chỉ 3 giây nếu trong chế độ demo) trên trang hợp lệ
    const triggerDelay = isDemoMode ? 3000 : 10000
    const timer = setTimeout(() => {
      timeSpentMet = true
      checkTrigger()
    }, triggerDelay)

    window.addEventListener('scroll', handleScroll)
    // Run initial scroll check in case they are already scrolled
    handleScroll()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [location.pathname, isDemoMode])

  // Bắt đầu đếm ngược khi popup mở ra
  useEffect(() => {
    if (!show) return

    // Animation xuất hiện mượt mà bằng GSAP
    gsap.fromTo(overlayRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.35, ease: 'power2.out' }
    )
    gsap.fromTo(modalRef.current, 
      { y: 50, scale: 0.95, opacity: 0 }, 
      { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.3)', delay: 0.1 }
    )
  }, [show])

  if (!show) return null

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-sm"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
      >
        {/* Left Side: Beautiful Image */}
        <div className="w-full md:w-1/2 relative min-h-[220px] md:min-h-full">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop"
            alt="Fashion Promo"
            className="w-full h-full object-cover absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/40 to-transparent pointer-events-none" />
        </div>

        {/* Right Side: Promo Content */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center relative bg-white">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blush/10 rounded-full blur-xl pointer-events-none" />
          
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-blush mb-1 block">
            {popupData.header}
          </span>
          <h3 className="font-display text-2xl font-bold text-brand-charcoal mb-3 pr-6 leading-tight">
            {popupData.title}
          </h3>
          <p className="text-brand-muted text-sm leading-relaxed mb-6">
            {popupData.description}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleGetPromo}
              className="w-full bg-brand-charcoal text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-brand-dark transition-all duration-300 active:scale-[0.98] cursor-pointer text-center"
            >
              Nhận mã & Mua ngay
            </button>
            <button
              onClick={handleClose}
              className="w-full text-brand-muted hover:text-brand-charcoal py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center"
            >
              Tôi chỉ muốn xem thêm
            </button>
          </div>
          
          {/* Absolute close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-brand-muted hover:text-brand-charcoal transition-colors p-1"
            aria-label="Đóng gợi ý"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
