import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import toast from 'react-hot-toast'
import { showAuthToast } from '../../utils/authToast.jsx'
import { RecommendationCard } from './RecommendationCard.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { getMockRecommendations } from '../../data/aiResponses.js'
import { duration, ease } from '../../utils/gsapDefaults.js'

gsap.registerPlugin(ScrollTrigger)

export const AIRecommendations = () => {
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { addItem } = useCartContext()
  const containerRef = useRef(null)
  const titleRef = useRef(null)
  const hasLoaded = useRef(false)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animate section title
      gsap.from(titleRef.current, {
        y: 50,
        opacity: 0,
        duration: duration.base,
        ease: ease.out,
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 85%',
          once: true,
        },
      })

      // Load recommendations on scroll into view (only once)
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          if (!hasLoaded.current) {
            hasLoaded.current = true
            // Simulate API call delay
            setIsLoading(true)
            setTimeout(() => {
              setRecommendations(getMockRecommendations())
              setIsLoading(false)
            }, 600)
          }
        },
      })

      // Stagger animation for recommendation cards
      if (recommendations.length > 0) {
        ScrollTrigger.batch('.recommendation-card', {
          onEnter: elements =>
            gsap.from(elements, {
              opacity: 0,
              y: 40,
              duration: duration.base,
              stagger: 0.08,
              ease: ease.out,
            }),
          once: true,
          start: 'top 85%',
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [recommendations])

  const handleAddToCart = (product) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      sessionStorage.setItem('pendingPurchase', JSON.stringify({ product, action: 'cart' }))
      sessionStorage.setItem('authRedirectUrl', window.location.pathname + window.location.search)
      showAuthToast('Đăng nhập để thêm sản phẩm vào giỏ hàng.')
      return
    }
    addItem(product, 1)
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`)
  }

  const handleBuyNow = (product) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      sessionStorage.setItem('pendingPurchase', JSON.stringify({ product, action: 'buy' }))
      sessionStorage.setItem('authRedirectUrl', '/cart')
      showAuthToast('Đăng nhập để tiến hành mua sắm ngay.')
      return
    }
    addItem(product, 1)
    navigate('/cart')
  }

  return (
    <section
      ref={containerRef}
      className="py-16 md:py-24 bg-brand-cream"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={titleRef}
          className="mb-12 md:mb-16 text-center"
        >
          <h2 className="section-heading mb-4">
            Gợi Ý Dành Riêng Cho Bạn
          </h2>
          <p className="text-brand-muted text-lg max-w-2xl mx-auto">
            Khám phá những sản phẩm được AI chọn lọc riêng theo phong cách và lịch sử xem của bạn.
          </p>
        </div>

        {/* Recommendations Grid or Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-brand-blush border-t-brand-charcoal
                            rounded-full animate-spin" />
              <p className="text-brand-muted">Đang tìm sản phẩm phù hợp nhất cho bạn...</p>
            </div>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {recommendations.map(product => (
              <div key={product.id} className="recommendation-card">
                <RecommendationCard
                  product={product}
                  reason={product.reason}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                />
              </div>
            ))}
          </div>
        ) : null}

        {/* CTA */}
        {recommendations.length > 0 && (
          <div className="text-center mt-12 md:mt-16">
            <p className="text-brand-muted mb-4">
              Muốn khám phá thêm? Trợ lý AI của chúng tôi sẽ giúp bạn tìm ra món đồ hoàn hảo.
            </p>
            <button
              onClick={() => {
                const token = localStorage.getItem('accessToken')
                if (!token) {
                  sessionStorage.setItem('authRedirectUrl', window.location.pathname + window.location.search)
                  showAuthToast('Đăng nhập để xem thêm gợi ý từ AI.')
                } else {
                  toast('Tính năng xem thêm gợi ý đang được phát triển!', { icon: '✨' })
                }
              }}
              className="btn-secondary"
            >
              Xem Thêm Gợi Ý
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
