import { useState, useLayoutEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { Header } from '../../components/Header/Header.jsx'
import { Footer } from '../../components/Footer/Footer.jsx'
import { ProductCard } from '../../components/ProductGrid/ProductCard.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { products } from '../../data/products.js'
import { showAuthToast } from '../../utils/authToast.jsx'

// Nhãn danh mục tiếng Việt
const categoryLabels = {
  all: 'Tất Cả',
  dresses: 'Đầm',
  tops: 'Áo',
  bottoms: 'Quần & Chân Váy',
  outerwear: 'Áo Khoác',
}

// Danh sách mã màu thực tế sang tên tiếng Việt
const colorOptions = [
  { hex: '#FFFFFF', label: 'Trắng' },
  { hex: '#2C2C2C', label: 'Charcoal (Đen Xám)' },
  { hex: '#F2C4CE', label: 'Hồng Blush' },
  { hex: '#E8D5B7', label: 'Beige' },
  { hex: '#8B7355', label: 'Nâu Sáng' },
  { hex: '#5A4A42', label: 'Nâu Đậm' },
]

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const ShopPage = () => {
  const { addItem } = useCartContext()
  const navigate = useNavigate()

  // State bộ lọc và sắp xếp
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [maxPrice, setMaxPrice] = useState(1500000)
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  const gridRef = useRef(null)

  // Xử lý filter và sort sản phẩm
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q))
    }

    // 2. Category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory)
    }

    // 3. Color
    if (selectedColor) {
      result = result.filter(p => p.colors.some(c => c.hex === selectedColor))
    }

    // 4. Size
    if (selectedSize) {
      result = result.filter(p => p.sizes.includes(selectedSize))
    }

    // 5. Price
    result = result.filter(p => p.price <= maxPrice)

    // 6. Sorting
    if (sortBy === 'newest') {
      // Giả lập sắp xếp theo id (các id lớn hơn là mới hơn)
      result.sort((a, b) => b.id.localeCompare(a.id))
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [searchQuery, selectedCategory, selectedColor, selectedSize, maxPrice, sortBy])

  // GSAP animation khi danh sách sản phẩm thay đổi
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.shop-product-item', {
        opacity: 0,
        y: 40,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }, gridRef)

    return () => ctx.revert()
  }, [filteredProducts, viewMode])

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

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedColor(null)
    setSelectedSize(null)
    setMaxPrice(1500000)
    setSortBy('newest')
  }

  return (
    <>
      <Header />
      
      <main className="pt-28 min-h-screen bg-brand-cream pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-charcoal mb-4">
              Cửa Hàng Mua Sắm
            </h1>
            <p className="text-brand-muted text-base max-w-xl">
              Khám phá tủ đồ lý tưởng với những thiết kế tinh tế, phù hợp cho mọi phong cách sống của bạn.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* ═══════════ LEFT COLUMN: FILTERS (SIDEBAR) ═══════════ */}
            <aside className="w-full lg:w-1/4 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6">
              
              {/* Clear filters trigger */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="font-semibold text-brand-charcoal text-lg">Bộ lọc tìm kiếm</h3>
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-brand-muted hover:text-brand-charcoal transition-colors border-b border-transparent hover:border-brand-charcoal"
                >
                  Xóa tất cả
                </button>
              </div>

              {/* 1. Search filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                  Tìm kiếm sản phẩm
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tên sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-cream/50 border border-gray-200 px-4 py-2.5 rounded-lg text-sm text-brand-charcoal focus:outline-none focus:border-brand-charcoal focus:ring-1 focus:ring-brand-blush/30 transition-all font-sans"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-charcoal text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Category list */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
                  Danh mục quần áo
                </label>
                <div className="flex flex-col gap-2">
                  {Object.keys(categoryLabels).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left text-sm py-1 px-2 rounded transition-all font-medium ${
                        selectedCategory === cat
                          ? 'bg-brand-charcoal text-white font-semibold'
                          : 'text-brand-charcoal hover:bg-brand-cream hover:text-brand-charcoal'
                      }`}
                    >
                      {categoryLabels[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Color swatches */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
                  Màu sắc
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {colorOptions.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setSelectedColor(selectedColor === color.hex ? null : color.hex)}
                      className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                        selectedColor === color.hex
                          ? 'border-brand-charcoal ring-2 ring-brand-blush scale-110'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    >
                      {selectedColor === color.hex && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: color.hex === '#FFFFFF' ? '#000000' : '#FFFFFF' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Sizes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
                  Kích cỡ (Size)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                      className={`py-1.5 px-3 border text-xs font-semibold rounded-lg text-center transition-all uppercase ${
                        selectedSize === size
                          ? 'border-brand-charcoal bg-brand-charcoal text-white'
                          : 'border-gray-200 hover:border-brand-charcoal text-brand-charcoal'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Max Price slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
                  <span>Giá tối đa</span>
                  <span className="text-brand-charcoal font-semibold normal-case">
                    {(maxPrice / 1000).toFixed(0)}k
                  </span>
                </div>
                <input
                  type="range"
                  min="200000"
                  max="1500000"
                  step="50000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-charcoal cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-brand-muted mt-1 font-semibold">
                  <span>200k</span>
                  <span>1.5M</span>
                </div>
              </div>

            </aside>

            {/* ═══════════ RIGHT COLUMN: PRODUCTS LIST ═══════════ */}
            <section className="w-full lg:w-3/4 flex flex-col gap-6">
              
              {/* Filter controls toolbar */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Result count */}
                <p className="text-sm font-medium text-brand-charcoal">
                  Hiển thị <span className="font-semibold text-brand-charcoal">{filteredProducts.length}</span> sản phẩm
                </p>

                {/* Grid/List and Sort */}
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  
                  {/* Grid / List view toggle */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-brand-cream text-brand-charcoal'
                          : 'bg-white text-brand-muted hover:text-brand-charcoal'
                      }`}
                      title="Hiển thị dạng lưới"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${
                        viewMode === 'list'
                          ? 'bg-brand-cream text-brand-charcoal'
                          : 'bg-white text-brand-muted hover:text-brand-charcoal'
                      }`}
                      title="Hiển thị dạng danh sách"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Sorter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-brand-muted uppercase whitespace-nowrap">
                      Sắp xếp:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-brand-cream/50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-charcoal transition-colors font-sans"
                    >
                      <option value="newest">Hàng mới nhất</option>
                      <option value="price-asc">Giá: Thấp đến Cao</option>
                      <option value="price-desc">Giá: Cao đến Thấp</option>
                      <option value="name-asc">Tên: A-Z</option>
                    </select>
                  </div>

                </div>

              </div>

              {/* Products Container */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                  <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-4 text-brand-muted">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-brand-charcoal mb-2">
                    Không tìm thấy sản phẩm
                  </h3>
                  <p className="text-brand-muted text-sm max-w-sm mx-auto mb-6">
                    Chúng tôi không tìm thấy kết quả nào phù hợp với bộ lọc hiện tại. Thử xóa bộ lọc để tìm lại nhé!
                  </p>
                  <button onClick={handleClearFilters} className="btn-primary py-2.5 px-6 rounded-lg text-xs">
                    Reset bộ lọc
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid view display */
                <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="shop-product-item">
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* List view display */
                <div ref={gridRef} className="flex flex-col gap-4">
                  {filteredProducts.map((product) => {
                    const discount = product.originalPrice
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : 0

                    return (
                      <div
                        key={product.id}
                        className="shop-product-item bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:shadow-md transition-shadow"
                      >
                        {/* Image wrapper */}
                        <div className="w-full sm:w-44 aspect-square rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          {product.badge && (
                            <span className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-wider bg-brand-blush text-brand-charcoal px-2 py-0.5 rounded-full">
                              {product.badge}
                            </span>
                          )}
                        </div>

                        {/* Description wrapper */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-brand-muted">
                              {categoryLabels[product.category] || product.category}
                            </span>
                            <h3 className="font-display text-xl font-bold text-brand-charcoal mt-1 mb-2">
                              {product.name}
                            </h3>
                            <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed mb-4">
                              {product.description || 'Chất liệu vải cao cấp mang lại cảm giác thoải mái tối ưu.'}
                            </p>

                              {/* Colors */}
                            <div className="flex gap-2 mb-4">
                              {product.colors.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-3.5 h-3.5 rounded-full border border-gray-300"
                                  style={{ backgroundColor: color.hex }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Price & actions */}
                          <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-gray-100">
                            
                            {/* Price */}
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-brand-charcoal text-lg">
                                {(product.price / 1000).toFixed(0)}k
                              </span>
                              {product.originalPrice && (
                                <>
                                  <span className="text-xs text-brand-muted line-through">
                                    {(product.originalPrice / 1000).toFixed(0)}k
                                  </span>
                                  <span className="text-[10px] font-bold bg-brand-blush text-brand-charcoal px-1.5 py-0.5 rounded">
                                    -{discount}%
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="border border-brand-charcoal text-brand-charcoal px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-cream transition-colors cursor-pointer"
                              >
                                Thêm Giỏ
                              </button>
                              <button
                                onClick={() => handleBuyNow(product)}
                                className="bg-brand-charcoal text-white px-5 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-dark transition-colors cursor-pointer"
                              >
                                Mua Ngay
                              </button>
                            </div>

                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}

            </section>

          </div>

        </div>
      </main>

      <Footer />
    </>
  )
}
