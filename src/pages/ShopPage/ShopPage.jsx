import { useState, useLayoutEffect, useRef, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { Header } from '../../components/Header/Header.jsx'
import { Footer } from '../../components/Footer/Footer.jsx'
import { ProductCard } from '../../components/ProductGrid/ProductCard.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { products } from '../../data/products.js'
import { showAuthToast } from '../../utils/authToast.jsx'
import categoryApi from '../../api/categoryApi.js'
import { isAdmin } from '../../utils/auth.js'

// Nhãn danh mục tiếng Việt
const categoryLabels = {
  all: 'Tất Cả',
  tops: 'Áo',
  bottoms: 'Quần',
  dresses: 'Váy & Đầm',
  sets: 'Set đồ',
  outerwear: 'Áo khoác',
  shoes: 'Giày',
  bags: 'Túi xách',
  accessories: 'Phụ kiện',
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

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '35', '36', '37', '38', '39', '40', 'OS']

const brandOptions = ['SHEIN', 'ASOS', 'Yody', 'Routine', 'IVY Moda']
const materialOptions = [
  'Cotton',
  'Lụa (Silk)',
  'Lanh (Linen)',
  'Dạ Tweed',
  'Jeans/Denim',
  'Voan (Chiffon)',
  'Thun Gân',
  'Da Thật',
  'Da Tổng Hợp',
]
const occasionOptions = ['Đi chơi', 'Đi làm', 'Dự tiệc', 'Công sở']

const extractKeywords = (catName) => {
  const catNameLower = catName.toLowerCase().normalize('NFC');
  let rawKeywords = [catNameLower];
  if (catNameLower.includes('&')) {
    rawKeywords = [...rawKeywords, ...catNameLower.split('&').map(k => k.trim())];
  }
  if (catNameLower.includes('(')) {
    rawKeywords = [...rawKeywords, ...catNameLower.split(/[\(\)]/).map(k => k.trim()).filter(Boolean)];
  }

  const stopWords = ['áo', 'quần', 'váy', 'đầm', 'set', 'giày', 'túi', 'balo', 'khoác'];
  
  const keywords = [];
  rawKeywords.forEach(kw => {
    let words = kw.split(' ');
    while (words.length > 0 && stopWords.includes(words[0])) {
      words.shift();
    }
    const cleanKw = words.join(' ').trim();
    if (cleanKw) {
      keywords.push(cleanKw);
      if (cleanKw.endsWith('s')) {
        keywords.push(cleanKw.substring(0, cleanKw.length - 1));
      }
    }
  });
  
  return [...new Set(keywords)];
};

export const ShopPage = () => {
  const { addItem } = useCartContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // State bộ lọc và sắp xếp
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [maxPrice, setMaxPrice] = useState(2000000)
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  // Bộ lọc mở rộng
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [selectedOccasions, setSelectedOccasions] = useState([])

  const [dbCategories, setDbCategories] = useState([])

  // Lấy danh mục từ BE khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getRootCategories()
        if (response && response.data) {
          const rootCates = response.data
          // Lấy tiếp các danh mục con cho mỗi danh mục gốc
          const fullCates = await Promise.all(
            rootCates.map(async (cat) => {
              try {
                const subResponse = await categoryApi.getCategoriesByParent(cat.id)
                const subs = subResponse && subResponse.data ? subResponse.data : []
                const subcategoriesWithParent = subs.map(sub => ({
                  ...sub,
                  parentCategory: cat
                }))
                return {
                  ...cat,
                  subcategories: subcategoriesWithParent
                }
              } catch (err) {
                return { ...cat, subcategories: [] }
              }
            })
          )
          setDbCategories(fullCates)
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục từ BE:', err)
      }
    }
    fetchCategories()
  }, [])

  // Đồng bộ từ URL query params
  useEffect(() => {
    let categoryParam = searchParams.get('category')
    const filterParam = searchParams.get('filter')

    if (categoryParam) {
      // Chuẩn hóa dấu cộng thành khoảng trắng
      categoryParam = categoryParam.replace(/\+/g, ' ')
      
      if (dbCategories.length > 0) {
        let found = null
        // Tìm ở cấp root
        found = dbCategories.find(cat => cat.name.toLowerCase().normalize('NFC') === categoryParam.toLowerCase().normalize('NFC'))
        if (!found) {
          // Tìm ở cấp sub
          for (const root of dbCategories) {
            const sub = root.subcategories?.find(s => s.name.toLowerCase().normalize('NFC') === categoryParam.toLowerCase().normalize('NFC'))
            if (sub) {
              found = sub
              break
            }
          }
        }
        if (found) {
          setSelectedCategory(found)
        } else {
          setSelectedCategory(categoryParam)
        }
      } else {
        setSelectedCategory(categoryParam)
      }
    } else {
      setSelectedCategory('all')
    }

    if (filterParam === 'new') {
      setSortBy('newest')
    }
  }, [searchParams, dbCategories])

  const gridRef = useRef(null)

  // Xử lý filter và sort sản phẩm
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q))
    }

    // 1.5. URL Filter (new / sale)
    const filterParam = searchParams.get('filter')
    if (filterParam === 'new') {
      result = result.filter(p => p.badge === 'new')
    } else if (filterParam === 'sale') {
      result = result.filter(p => p.badge === 'sale' || (p.originalPrice && p.originalPrice > p.price))
    }

    // 2. Category
    if (selectedCategory !== 'all') {
      const targetCategoryStr = (typeof selectedCategory === 'string' ? selectedCategory : selectedCategory.name)
        .replace(/\+/g, ' ')
        .toLowerCase()
        .normalize('NFC')
        
      result = result.filter(p => {
        const productCategoryLower = p.category.toLowerCase().normalize('NFC')
        const productNameLower = p.name.toLowerCase().normalize('NFC')
        
        // 1. So khớp trực tiếp danh mục gốc (Áo -> tops, Quần -> bottoms, etc.)
        const isDirectMatch = (
          productCategoryLower === targetCategoryStr ||
          (targetCategoryStr === 'áo' && productCategoryLower === 'tops') ||
          (targetCategoryStr === 'quần' && productCategoryLower === 'bottoms') ||
          (targetCategoryStr === 'váy & đầm' && productCategoryLower === 'dresses') ||
          (targetCategoryStr === 'đầm' && productCategoryLower === 'dresses') ||
          (targetCategoryStr === 'set đồ' && productCategoryLower === 'sets') ||
          (targetCategoryStr === 'áo khoác' && productCategoryLower === 'outerwear') ||
          (targetCategoryStr === 'giày' && productCategoryLower === 'shoes') ||
          (targetCategoryStr === 'túi xách' && productCategoryLower === 'bags') ||
          (targetCategoryStr === 'phụ kiện' && productCategoryLower === 'accessories')
        )
        
        if (isDirectMatch) return true
        
        // 2. Kiểm tra xem có phải là danh mục con (ví dụ: 'áo sơ mi') của một danh mục cha
        let parentNameLower = null
        if (typeof selectedCategory === 'object' && selectedCategory.parentCategory) {
          parentNameLower = selectedCategory.parentCategory.name.toLowerCase().normalize('NFC')
        } else {
          // Đoán cha của danh mục con dựa trên từ khóa nếu selectedCategory là string
          if (targetCategoryStr.startsWith('áo khoác')) parentNameLower = 'áo khoác'
          else if (targetCategoryStr.startsWith('áo ')) parentNameLower = 'áo'
          else if (targetCategoryStr.startsWith('quần ') || targetCategoryStr === 'chân váy') parentNameLower = 'quần'
          else if (targetCategoryStr.startsWith('đầm ')) parentNameLower = 'váy & đầm'
          else if (targetCategoryStr.startsWith('set ')) parentNameLower = 'set đồ'
          else if (targetCategoryStr.startsWith('giày ')) parentNameLower = 'giày'
          else if (targetCategoryStr.startsWith('túi ')) parentNameLower = 'túi xách'
        }
        
        if (parentNameLower) {
          const isFromParent = (
            (parentNameLower === 'áo' && productCategoryLower === 'tops') ||
            (parentNameLower === 'quần' && productCategoryLower === 'bottoms') ||
            (parentNameLower === 'váy & đầm' && productCategoryLower === 'dresses') ||
            (parentNameLower === 'set đồ' && productCategoryLower === 'sets') ||
            (parentNameLower === 'áo khoác' && productCategoryLower === 'outerwear') ||
            (parentNameLower === 'giày' && productCategoryLower === 'shoes') ||
            (parentNameLower === 'túi xách' && productCategoryLower === 'bags') ||
            (parentNameLower === 'phụ kiện' && productCategoryLower === 'accessories')
          )
          
          if (isFromParent) {
            const keywords = extractKeywords(targetCategoryStr)
            return keywords.some(k => productNameLower.includes(k) || p.tags.some(t => t.toLowerCase().normalize('NFC').includes(k)))
          }
        }
        
        // 3. Nếu selectedCategory là danh mục cha (object), hiển thị cả sản phẩm của các danh mục con của nó
        if (typeof selectedCategory === 'object' && selectedCategory.subcategories) {
          const subNames = selectedCategory.subcategories.map(s => s.name.toLowerCase().normalize('NFC'))
          const matchesAnySub = subNames.some(subName => {
            let keyword = subName
            if (keyword.startsWith('áo ')) keyword = keyword.substring(3)
            if (keyword.startsWith('quần ')) keyword = keyword.substring(5)
            if (keyword.startsWith('đầm ')) keyword = keyword.substring(4)
            if (keyword.startsWith('set ')) keyword = keyword.substring(4)
            if (keyword.startsWith('giày ')) keyword = keyword.substring(5)
            if (keyword.startsWith('túi ')) keyword = keyword.substring(4)
            if (keyword.startsWith('balo ')) keyword = keyword.substring(5)
            return productNameLower.includes(keyword) || p.tags.some(t => t.toLowerCase().normalize('NFC').includes(keyword))
          })
          if (matchesAnySub) return true
        }

        return false
      })
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

    // 6. Brand
    if (selectedBrands.length > 0) {
      result = result.filter(p => p.brand && selectedBrands.includes(p.brand))
    }

    // 7. Material
    if (selectedMaterials.length > 0) {
      result = result.filter(p => p.material && selectedMaterials.includes(p.material))
    }

    // 8. Occasion
    if (selectedOccasions.length > 0) {
      result = result.filter(p => p.occasion && selectedOccasions.includes(p.occasion))
    }

    // 9. Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => b.id.localeCompare(a.id))
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [searchQuery, selectedCategory, selectedColor, selectedSize, maxPrice, sortBy, selectedBrands, selectedMaterials, selectedOccasions, searchParams])

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
    sessionStorage.setItem('checkoutOnlyProductId', product.id)
    navigate('/cart')
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedColor(null)
    setSelectedSize(null)
    setMaxPrice(2000000)
    setSortBy('newest')
    setSelectedBrands([])
    setSelectedMaterials([])
    setSelectedOccasions([])
    setSearchParams({})
  }

  const handleToggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const handleToggleMaterial = (mat) => {
    setSelectedMaterials(prev =>
      prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat]
    )
  }

  const handleToggleOccasion = (occ) => {
    setSelectedOccasions(prev =>
      prev.includes(occ) ? prev.filter(o => o !== occ) : [...prev, occ]
    )
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
                  id="btn-clear-filters"
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
                    id="search-product-input"
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
                <div className="flex flex-col gap-1">
                  {/* Option: Tất cả */}
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchParams({});
                    }}
                    className={`text-left text-sm py-2 px-3 rounded-lg transition-all font-semibold ${
                      selectedCategory === 'all'
                        ? 'bg-brand-charcoal text-white shadow-sm'
                        : 'text-brand-charcoal hover:bg-brand-cream'
                    }`}
                  >
                    Tất Cả
                  </button>

                  {dbCategories.length > 0 ? (
                    // Hiển thị danh mục động từ BE theo kiểu đa cấp (Zara/Uniqlo style)
                    dbCategories.map((cat) => {
                      const isRootSelected = selectedCategory !== 'all' && (
                        selectedCategory.id === cat.id || 
                        selectedCategory.name === cat.name ||
                        selectedCategory.parent === cat.id ||
                        selectedCategory.parentId === cat.id
                      );
                      return (
                        <div key={cat.id} className="flex flex-col mt-1">
                          {/* Root category */}
                          <button
                            onClick={() => {
                              setSelectedCategory(cat);
                              setSearchParams({ category: cat.name });
                            }}
                            className={`text-left text-sm py-1.5 px-3 rounded-lg transition-all font-semibold flex items-center justify-between group ${
                              isRootSelected
                                ? 'bg-brand-charcoal text-white'
                                : 'text-brand-charcoal hover:bg-brand-cream'
                            }`}
                          >
                            <span>{cat.name}</span>
                            {cat.subcategories && cat.subcategories.length > 0 && (
                              <svg className={`w-3.5 h-3.5 transition-transform duration-205 ${isRootSelected ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </button>

                          {/* Subcategories */}
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <div className="flex flex-col pl-4 gap-1.5 mt-1 mb-2 border-l border-gray-100 ml-3.5">
                              {cat.subcategories.map((sub) => {
                                const isSubSelected = selectedCategory !== 'all' && (selectedCategory.id === sub.id || selectedCategory.name === sub.name);
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => {
                                      setSelectedCategory(sub);
                                      setSearchParams({ category: sub.name });
                                    }}
                                    className={`text-left text-xs py-1 px-2 rounded transition-all font-medium ${
                                      isSubSelected
                                        ? 'text-brand-blush font-bold border-l-2 border-brand-blush pl-1.5'
                                        : 'text-brand-muted hover:text-brand-charcoal'
                                    }`}
                                  >
                                    {sub.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    // Fallback sang danh mục tĩnh nếu BE chưa có dữ liệu
                    Object.keys(categoryLabels).filter(key => key !== 'all').map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-left text-sm py-1.5 px-3 rounded-lg transition-all font-medium ${
                          selectedCategory === cat
                            ? 'bg-brand-charcoal text-white font-semibold'
                            : 'text-brand-charcoal hover:bg-brand-cream'
                        }`}
                      >
                        {categoryLabels[cat]}
                      </button>
                    ))
                  )}
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

              {/* Thương hiệu, Chất liệu, Dịp sử dụng bộ lọc đã bỏ theo yêu cầu */}

              {/* 8. Max Price slider */}
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
                  max="2000000"
                  step="50000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-charcoal cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-brand-muted mt-1 font-semibold">
                  <span>200k</span>
                  <span>2.0M</span>
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
