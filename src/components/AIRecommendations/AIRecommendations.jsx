import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import toast from 'react-hot-toast'
import { showAuthToast } from '../../utils/authToast.jsx'
import { ProductCard } from '../ProductGrid/ProductCard.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { duration, ease } from '../../utils/gsapDefaults.js'
import productApi from '../../api/productApi.js'
import { mapDbProduct } from '../../utils/productMapper.js'

gsap.registerPlugin(ScrollTrigger)

export const AIRecommendations = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { addItem } = useCartContext()
  const containerRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        // BE public chưa có best-seller; hiển thị 4 sản phẩm mới nhất.
        const res = await productApi.getAllProducts({ page: 0, size: 4 })
        if (res && res.data && res.data.content && isMounted) {
          const mapped = res.data.content.map(p => mapDbProduct(p)).filter(Boolean)
          setProducts(mapped)
        }
      } catch (err) {
        console.error('Error fetching best seller products:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchProducts()
    return () => { isMounted = false }
  }, [])

  useLayoutEffect(() => {
    if (isLoading || products.length === 0) return

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

      // Stagger animation for product cards
      ScrollTrigger.batch('.product-card', {
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
    }, containerRef)

    return () => ctx.revert()
  }, [isLoading, products])

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      sessionStorage.setItem('pendingPurchase', JSON.stringify({ product, action: 'cart' }))
      sessionStorage.setItem('authRedirectUrl', window.location.pathname + window.location.search)
      showAuthToast('Đăng nhập để thêm sản phẩm vào giỏ hàng.')
      return
    }
    try {
      await addItem(product, 1)
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể thêm sản phẩm vào giỏ hàng.')
    }
  }

  const handleBuyNow = async (product) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      sessionStorage.setItem('pendingPurchase', JSON.stringify({ product, action: 'buy' }))
      sessionStorage.setItem('authRedirectUrl', '/cart')
      showAuthToast('Đăng nhập để tiến hành mua sắm ngay.')
      return
    }
    try {
      await addItem(product, 1)
      navigate('/cart')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể mua sản phẩm này lúc này.')
    }
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
            Sản Phẩm Gợi Ý
          </h2>
          <p className="text-brand-muted text-lg max-w-2xl mx-auto">
            Một số thiết kế mới nhất hiện có tại cửa hàng.
          </p>
        </div>

        {/* Products Grid or Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-brand-blush border-t-brand-charcoal
                            rounded-full animate-spin" />
              <p className="text-brand-muted">Đang tải danh sách sản phẩm...</p>
            </div>
          </div>
        ) : products.length > 0 ? (
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
        ) : (
          <p className="text-center text-brand-muted">Chưa có sản phẩm nào.</p>
        )}
      </div>
    </section>
  )
}
