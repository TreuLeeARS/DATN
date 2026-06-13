import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ProductBadge } from './ProductBadge.jsx'
import { cn } from '../../utils/cn.js'
import { duration, ease } from '../../utils/gsapDefaults.js'

// Nhãn danh mục tiếng Việt
const categoryLabels = {
  dresses: 'Đầm',
  tops: 'Áo',
  bottoms: 'Quần & Chân Váy',
  outerwear: 'Áo Khoác',
}

export const ProductCard = ({ product, onAddToCart }) => {
  const cardRef = useRef(null)
  const imageRef = useRef(null)
  const overlayRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const timelineRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Create hover timeline once
      timelineRef.current = gsap.timeline({ paused: true })

      timelineRef.current
        .to(imageRef.current, {
          scale: 1.08,
          duration: duration.base,
          ease: ease.out,
        }, 0)
        .to(overlayRef.current, {
          opacity: 0.4,
          duration: duration.base,
          ease: ease.out,
        }, 0)
    }, cardRef)

    return () => ctx.revert()
  }, [])

  // Play/reverse timeline on hover state change
  useLayoutEffect(() => {
    if (timelineRef.current) {
      if (isHovered) {
        timelineRef.current.play()
      } else {
        timelineRef.current.reverse()
      }
    }
  }, [isHovered])

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

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

        {/* Overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-brand-charcoal opacity-0 transition-opacity duration-300"
        />

        {/* Badge */}
        <ProductBadge type={product.badge} />

        {/* Add to Cart Button */}
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
        <p className="text-xs uppercase text-brand-muted mb-2">{categoryLabels[product.category] || product.category}</p>
        <h3 className="font-display text-lg text-brand-charcoal mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-brand-charcoal">
            {(product.price / 1000).toFixed(0)}k
          </span>
          {product.originalPrice && (
            <>
              <span className="text-xs text-brand-muted line-through">
                {(product.originalPrice / 1000).toFixed(0)}k
              </span>
              <span className="text-xs bg-brand-blush text-brand-charcoal px-2 py-1 rounded">
                -{discount}%
              </span>
            </>
          )}
        </div>

        {/* Color swatches */}
        <div className="flex gap-2 mt-3">
          {product.colors.slice(0, 3).map((color, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: color }}
              aria-label={`Color option ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
