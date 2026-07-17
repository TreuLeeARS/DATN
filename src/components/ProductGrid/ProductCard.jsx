import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { formatVND } from '../../utils/price.js'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ProductBadge } from './ProductBadge.jsx'
import { duration, ease } from '../../utils/gsapDefaults.js'
import productApi from '../../api/productApi'
import { mapDbProduct } from '../../utils/productMapper'

// Nhãn danh mục tiếng Việt
const categoryLabels = {
  tops: 'Áo',
  bottoms: 'Quần',
  dresses: 'Váy & Đầm',
  sets: 'Set đồ',
  outerwear: 'Áo khoác',
  shoes: 'Giày',
  bags: 'Túi xách',
  accessories: 'Phụ kiện',
}

export const ProductCard = ({ product: initialProduct, onAddToCart, onBuyNow }) => {
  const cardRef = useRef(null)
  const imageRef = useRef(null)
  const overlayRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [showWarning, setShowWarning] = useState(false)
  const timelineRef = useRef(null)

  const [detailedProduct, setDetailedProduct] = useState(null)
  const [brokenImages, setBrokenImages] = useState({})

  useEffect(() => {
    let isMounted = true
    const fetchDetail = async () => {
      if (initialProduct.variants && initialProduct.variants.length > 0) {
        setDetailedProduct(initialProduct)
        return
      }
      
      const productId = initialProduct.productId || initialProduct.id
      if (!productId || isNaN(productId)) return

      try {
        const res = await productApi.getProductDetail(Number(productId))
        if (res && res.data && isMounted) {
          const mapped = mapDbProduct(res.data)
          setDetailedProduct(mapped)
        }
      } catch (err) {
        console.error('Error loading product details in card:', err)
      }
    }
    fetchDetail()
    return () => { isMounted = false }
  }, [initialProduct])

  const product = detailedProduct || initialProduct


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

  const isOutOfStock = (() => {
    if (!product.variants?.length) return true;
    if (selectedColor === null || !selectedSize) return false;
    const selColorName = product.colors[selectedColor]?.name;
    const variant = product.variants?.find(
      v => v.color?.toLowerCase() === selColorName?.toLowerCase() && v.size === selectedSize
    );
    return !variant || (variant.quantityInStock || 0) <= 0;
  })();

  return (
    <>
      <div
        ref={cardRef}
        className="product-card group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          setBrokenImages({})
          setActiveImageIndex(0)
          setSelectedColor(null)
          setSelectedSize(null)
          setShowWarning(false)
          setIsModalOpen(true)
        }}
        data-scroll-item
      >
        {/* Product Image */}
        <div className="relative overflow-hidden bg-gray-100 aspect-square">
          <img
            ref={imageRef}
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300"
            loading="lazy"
          />

          {/* Overlay */}
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-brand-charcoal opacity-0 transition-opacity duration-300"
          />

          {/* Badge */}
          <ProductBadge type={product.badge} />

          {/* Action Buttons Container */}
          <div
            className="absolute bottom-0 left-0 right-0 flex z-10
                       transform translate-y-full group-hover:translate-y-0
                       transition-transform duration-300 opacity-0 group-hover:opacity-100"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setBrokenImages({})
                setActiveImageIndex(0)
                setSelectedColor(null)
                setSelectedSize(null)
                setShowWarning(true)
                setIsModalOpen(true)
              }}
              className="flex-1 bg-white text-brand-charcoal py-3 font-semibold uppercase tracking-wider text-xs border-r border-gray-100 hover:bg-gray-50 transition-colors"
            >
              Thêm Giỏ
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setBrokenImages({})
                setActiveImageIndex(0)
                setSelectedColor(null)
                setSelectedSize(null)
                setShowWarning(true)
                setIsModalOpen(true)
              }}
              className="flex-1 bg-brand-charcoal text-white py-3 font-semibold uppercase tracking-wider text-xs hover:bg-brand-dark transition-colors"
            >
              Mua Ngay
            </button>
          </div>
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
              {formatVND(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-xs text-brand-muted line-through">
                  {formatVND(product.originalPrice)}
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
                style={{ backgroundColor: color.hex }}
                aria-label={`Color option ${color.name}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl md:h-auto md:max-h-[85vh] md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-brand-charcoal hover:opacity-75 transition-opacity p-2 bg-brand-cream rounded-full z-10 w-9 h-9 flex items-center justify-center font-bold"
              aria-label="Đóng chi tiết sản phẩm"
            >
              ✕
            </button>

            {/* Left Column: Image Gallery */}
            <div className="w-full shrink-0 bg-brand-cream/20 p-4 md:w-1/2 md:p-6">
              <div className="relative h-[34vh] max-h-[280px] w-full overflow-hidden rounded-xl bg-gray-50 md:h-auto md:max-h-none md:aspect-[4/5]">
                <img
                  src={
                    (product.images[activeImageIndex] && !brokenImages[activeImageIndex])
                      ? product.images[activeImageIndex]
                      : (product.images.find((img, idx) => img && img.trim() !== '' && !brokenImages[idx]) || 'https://placehold.co/600x600/faf8f6/a3a3c2?text=No+Image')
                  }
                  alt={`${product.name} - Chi tiết`}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                {product.badge && (
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-brand-blush text-brand-charcoal px-2.5 py-1 rounded-full shadow-sm">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {product.images.filter((img, idx) => img && img.trim() !== '' && !brokenImages[idx]).length > 1 && (
                <div className="mt-3 flex flex-wrap justify-start gap-2 py-1 md:mt-4">
                  {product.images.map((img, idx) => {
                    if (!img || img.trim() === '' || brokenImages[idx]) return null;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                          activeImageIndex === idx 
                            ? 'border-brand-charcoal scale-105 shadow-sm' 
                            : 'border-gray-200 hover:border-brand-charcoal/50'
                        }`}
                      >
                        <img 
                          src={img} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={() => {
                            setBrokenImages(prev => ({ ...prev, [idx]: true }))
                          }}
                        />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Details & Purchases */}
            <div className="flex min-h-0 w-full flex-1 flex-col md:w-1/2">
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted">
                  {categoryLabels[product.category] || product.category}
                </span>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-charcoal mt-1 mb-4 leading-tight">
                  {product.name}
                </h2>

                {/* Price Section */}
                <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                  <span className="font-bold text-brand-charcoal text-2xl">
                    {(() => {
                      if (selectedColor !== null && selectedSize) {
                        const selColorName = product.colors[selectedColor]?.name;
                        const variant = product.variants?.find(
                          v => v.color?.toLowerCase() === selColorName?.toLowerCase() && v.size === selectedSize
                        );
                        if (variant && variant.price) {
                          return formatVND(Number(variant.price));
                        }
                      }
                      return formatVND(product.price);
                    })()}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-sm text-brand-muted line-through">
                        {formatVND(product.originalPrice)}
                      </span>
                      <span className="text-xs font-bold bg-brand-blush text-brand-charcoal px-2 py-0.5 rounded shadow-sm">
                        -{discount}%
                      </span>
                    </>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-brand-muted leading-relaxed mb-6">
                  {product.description || 'Sản phẩm chất lượng cao mang phong cách tối giản thanh lịch, đường may tỉ mỉ, phom dáng tôn vẻ đẹp tự nhiên của người mặc.'}
                </p>

                {/* Color swatches */}
                <div className="mb-6">
                  <span className="block text-xs uppercase font-bold tracking-wider text-brand-muted mb-3">
                    Màu sắc {selectedColor !== null ? <span className="text-brand-charcoal">• {product.colors[selectedColor].name}</span> : <span className="text-brand-blush">• Chọn một màu</span>}
                  </span>
                  <div className="flex gap-3">
                    {product.colors.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedColor(i); setShowWarning(false) }}
                        className={`w-7 h-7 rounded-full shadow-sm cursor-pointer transition-all duration-200 ${
                          selectedColor === i
                            ? 'ring-2 ring-offset-2 ring-brand-charcoal scale-110'
                            : 'border border-gray-300 hover:scale-110'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                        aria-label={`Chọn màu ${color.name}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Size options */}
                <div className="mb-8">
                  <span className="block text-xs uppercase font-bold tracking-wider text-brand-muted mb-3">
                    Kích cỡ {selectedSize ? <span className="text-brand-charcoal">• {selectedSize}</span> : <span className="text-brand-blush">• Chọn size</span>}
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => { setSelectedSize(size); setShowWarning(false) }}
                        className={`py-1.5 px-3 text-xs font-semibold rounded-md cursor-pointer transition-all duration-200 ${
                          selectedSize === size
                            ? 'bg-brand-charcoal text-white border-2 border-brand-charcoal shadow-sm scale-105'
                            : 'border border-gray-200 text-brand-charcoal bg-gray-50 hover:border-brand-charcoal hover:bg-brand-cream'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Level Display */}
                {selectedColor !== null && selectedSize && (
                  <div className="mb-6 bg-brand-cream/35 p-3.5 border border-brand-charcoal/5 flex justify-between items-center text-xs">
                    <span className="font-semibold text-brand-charcoal uppercase tracking-wider">Tình trạng kho</span>
                    {(() => {
                      const selColorName = product.colors[selectedColor]?.name;
                      const variant = product.variants?.find(
                        v => v.color?.toLowerCase() === selColorName?.toLowerCase() && v.size === selectedSize
                      );
                      
                      if (!variant) {
                        return <span className="text-red-500 font-bold uppercase tracking-wider">Ngừng kinh doanh</span>;
                      }
                      
                      const stock = variant.quantityInStock || 0;
                      if (stock <= 0) {
                        return <span className="text-red-600 font-bold uppercase tracking-wider">Tạm hết hàng</span>;
                      }
                      return (
                        <span className="text-brand-charcoal font-medium">
                          Còn lại <strong className="font-bold text-sm text-brand-charcoal">{stock}</strong> sản phẩm
                        </span>
                      );
                    })()}
                  </div>
                )}

                {/* Warning */}
                {showWarning && (
                  <p className="text-xs text-red-500 font-semibold mb-2 animate-pulse">
                    ⚠ Vui lòng chọn màu sắc và kích cỡ trước khi tiếp tục.
                  </p>
                )}
              </div>

              {/* Purchase Buttons */}
              <div className="flex shrink-0 gap-3 border-t border-gray-100 bg-white px-4 py-3 md:px-8 md:py-4">
                <button
                  disabled={isOutOfStock}
                  onClick={() => {
                    if (selectedColor === null || !selectedSize) { setShowWarning(true); return }
                    onAddToCart({
                      ...product,
                      selectedColor: product.colors[selectedColor].name,
                      selectedColorHex: product.colors[selectedColor].hex,
                      selectedSize
                    })
                    setIsModalOpen(false)
                  }}
                  className={`flex-1 border border-brand-charcoal text-brand-charcoal py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-brand-cream transition-colors active:scale-[0.98] cursor-pointer ${
                    isOutOfStock ? 'opacity-35 cursor-not-allowed hover:bg-transparent' : ''
                  }`}
                >
                  {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                </button>
                <button
                  disabled={isOutOfStock}
                  onClick={() => {
                    if (selectedColor === null || !selectedSize) { setShowWarning(true); return }
                    onBuyNow({
                      ...product,
                      selectedColor: product.colors[selectedColor].name,
                      selectedColorHex: product.colors[selectedColor].hex,
                      selectedSize
                    })
                    setIsModalOpen(false)
                  }}
                  className={`flex-1 bg-brand-charcoal text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-brand-dark transition-colors active:scale-[0.98] cursor-pointer ${
                    isOutOfStock ? 'opacity-35 cursor-not-allowed hover:bg-brand-charcoal' : ''
                  }`}
                >
                  {isOutOfStock ? 'Hết hàng' : 'Mua Ngay'}
                </button>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
