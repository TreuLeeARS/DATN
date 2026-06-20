import { useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import toast from 'react-hot-toast'
import { showAuthToast } from '../../utils/authToast.jsx'
import { ProductCard } from './ProductCard.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { products } from '../../data/products.js'
import { duration, ease, stagger } from '../../utils/gsapDefaults.js'

gsap.registerPlugin(ScrollTrigger)

export const ProductGrid = () => {
  const { addItem } = useCartContext()
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const titleRef = useRef(null)

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

      // Stagger animation for product cards on scroll
      ScrollTrigger.batch('.product-card', {
        onEnter: elements =>
          gsap.from(elements, {
            opacity: 0,
            y: 60,
            duration: duration.base,
            stagger: stagger.cards,
            ease: ease.out,
          }),
        once: true,
        start: 'top 85%',
      })
    }, gridRef)

    return () => ctx.revert()
  }, [])

  const handleAddToCart = (product) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      showAuthToast('Đăng nhập để thêm sản phẩm vào giỏ hàng.')
      return
    }
    addItem(product, 1)
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`)
  }

  const handleBuyNow = (product) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      showAuthToast('Đăng nhập để tiến hành mua sắm ngay.')
      return
    }
    addItem(product, 1)
    navigate('/cart')
  }

  return (
    <section
      ref={gridRef}
      id="products"
      className="py-16 md:py-24 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={titleRef}
          className="mb-12 md:mb-16 text-center"
        >
          <h2 className="section-heading mb-4">
            Bộ Sưu Tập Chọn Lọc
          </h2>
          <p className="text-brand-muted text-lg max-w-2xl mx-auto">
            Khám phá những thiết kế vượt thời gian được tuyển chọn dành riêng cho người phụ nữ hiện đại.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12 md:mt-16">
          <button
            onClick={() => navigate('/shop')}
            className="btn-secondary"
          >
            Xem Tất Cả Sản Phẩm
          </button>
        </div>
      </div>
    </section>
  )
}
