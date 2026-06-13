import { useRef, useState, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ProductBadge } from '../ProductGrid/ProductBadge.jsx'
import { duration, ease } from '../../utils/gsapDefaults.js'

export const RecommendationCard = ({ product, reason, onAddToCart }) => {
  const cardRef = useRef(null)
  const imageRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const timelineRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      timelineRef.current = gsap.timeline({ paused: true })

      timelineRef.current
        .to(imageRef.current, {
          scale: 1.08,
          duration: duration.base,
          ease: ease.out,
        }, 0)
    }, cardRef)

    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    if (timelineRef.current) {
      if (isHovered) {
        timelineRef.current.play()
      } else {
        timelineRef.current.reverse()
      }
    }
  }, [isHovered])

  return (
    <div
      ref={cardRef}
      className="product-card group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-scroll-item
    >
      {/* Product Image */}
      <div className="relative overflow-hidden bg-gray-100 aspect-square">
        <img
          ref={imageRef}
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300"
        />

        <ProductBadge type={product.badge} />

        <button
          onClick={() => onAddToCart(product)}
          className="absolute bottom-0 left-0 right-0 bg-white text-brand-charcoal
                     py-3 font-medium uppercase tracking-wider text-sm
                     transform translate-y-full group-hover:translate-y-0
                     transition-transform duration-300 opacity-0 group-hover:opacity-100"
        >
          Thêm Vào Giỏ
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Recommendation Reason */}
        <p className="text-xs text-brand-blush font-semibold uppercase mb-2 block">
          ✨ {reason}
        </p>

        <h3 className="font-display text-lg text-brand-charcoal mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-charcoal">
            {(product.price / 1000).toFixed(0)}k
          </span>
          {product.originalPrice && (
            <span className="text-xs text-brand-muted line-through">
              {(product.originalPrice / 1000).toFixed(0)}k
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
