import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RecommendationCard } from './RecommendationCard.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { getMockRecommendations } from '../../data/aiResponses.js'
import { duration, ease } from '../../utils/gsapDefaults.js'

gsap.registerPlugin(ScrollTrigger)

export const AIRecommendations = ({ userId = null }) => {
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
              setRecommendations(getMockRecommendations(userId))
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
  }, [recommendations, userId])

  const handleAddToCart = (product) => {
    addItem(product, 1)
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
            <a href="#" className="btn-secondary">
              Xem Thêm Gợi Ý
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
