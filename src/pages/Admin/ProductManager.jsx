import { useState, useEffect } from 'react'
import { formatVND } from '../../utils/price.js'
import toast from 'react-hot-toast'
import productApi from '../../api/productApi'
import categoryApi from '../../api/categoryApi'
import { ConfirmModal } from '../../components/ConfirmModal.jsx'

const translateColor = (color) => {
  if (!color) return ''
  const mapping = {
    'white': 'Trắng',
    'black': 'Đen',
    'pink': 'Hồng',
    'beige': 'Be',
    'brown': 'Nâu',
    'grey': 'Xám',
    'red': 'Đỏ',
    'blue': 'Xanh',
    'yellow': 'Vàng',
    'charcoal': 'Charcoal'
  }
  return mapping[color.toLowerCase()] || color
}

const getColorDot = (color) => {
  const c = (color || '').toLowerCase()
  if (c.includes('trắng') || c.includes('white')) return 'bg-white border border-gray-300'
  if (c.includes('đen') || c.includes('black') || c.includes('charcoal')) return 'bg-gray-900'
  if (c.includes('hồng') || c.includes('pink')) return 'bg-pink-400'
  if (c.includes('be') || c.includes('beige')) return 'bg-amber-100 border border-amber-200'
  if (c.includes('nâu') || c.includes('brown')) return 'bg-amber-800'
  if (c.includes('xám') || c.includes('grey')) return 'bg-gray-400'
  if (c.includes('đỏ') || c.includes('red')) return 'bg-red-500'
  if (c.includes('xanh') || c.includes('blue')) return 'bg-blue-500'
  if (c.includes('vàng') || c.includes('yellow')) return 'bg-yellow-400'
  return 'bg-gray-300'
}

export const ProductManager = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  
  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingVariant, setEditingVariant] = useState(null)
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null)
  const [uploadingIndex, setUploadingIndex] = useState(null)
  
  // Selected colors and sizes state for product creation
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  
  // Search query state for products
  const [searchQuery, setSearchQuery] = useState('')
  
  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false
  })

  const openConfirm = (title, message, onConfirm, isDestructive = false) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      },
      isDestructive
    })
  }

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    baseprice: '',
    categoryId: '',
    imageUrls: ['']
  })

  const [variantForm, setVariantForm] = useState({
    size: 'S',
    color: 'Trắng',
    price: '',
    quantityInStock: 10,
    sku: ''
  })

  // Fetch categories & products on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [page, pageSize])

  // Fetch when search query is cleared
  useEffect(() => {
    if (searchQuery.trim() === '') {
      if (page === 0) {
        fetchProducts()
      } else {
        setPage(0)
      }
    }
  }, [searchQuery])

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAllCategoriesForAdmin()
      if (res && res.data) {
        setCategories(res.data)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      let res
      if (searchQuery.trim() !== '') {
        res = await productApi.searchProducts({
          name: searchQuery.trim(),
          page: page,
          size: pageSize
        })
      } else {
        res = await productApi.getAllProductsForAdmin({
          page: page,
          size: pageSize,
          sort: 'productId,desc'
        })
      }
      if (res && res.data) {
        setProducts(res.data.content || [])
        setTotalPages(res.data.totalPages || 1)
        setTotalElements(res.data.totalElements || (res.data.content ? res.data.content.length : 0))
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      toast.error('Không thể tải danh sách sản phẩm.')
    } finally {
      setLoading(false)
    }
  }

  // --- PRODUCT CRUD ACTIONS ---

  const handleOpenProductModal = (prod = null) => {
    // Scroll smoothly to top of window so modal pops up right in front of eyes
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (prod) {
      setEditingProduct(prod)
      // Auto-match categoryId by c.id or c.categoryId or categoryName
      let matchedCatId = prod.categoryId
      if (!matchedCatId && prod.categoryName) {
        const found = categories.find(c => c.name?.trim().toLowerCase() === prod.categoryName?.trim().toLowerCase())
        if (found) matchedCatId = found.id !== undefined ? found.id : found.categoryId
      }
      const firstCatId = categories.length > 0 ? (categories[0].id !== undefined ? categories[0].id : categories[0].categoryId) : ''
      setProductForm({
        name: prod.name || '',
        description: prod.description || '',
        baseprice: prod.baseprice || '',
        categoryId: matchedCatId || firstCatId,
        imageUrls: prod.imageUrls && prod.imageUrls.length > 0 ? [...prod.imageUrls] : ['']
      })
      setSelectedColors([])
      setSelectedSizes([])
    } else {
      setEditingProduct(null)
      const firstCatId = categories.length > 0 ? (categories[0].id !== undefined ? categories[0].id : categories[0].categoryId) : ''
      setProductForm({
        name: '',
        description: '',
        baseprice: '',
        categoryId: firstCatId,
        imageUrls: ['']
      })
      setSelectedColors(['Trắng', 'Đen'])
      setSelectedSizes(['S', 'M', 'L'])
    }
    setIsProductModalOpen(true)
  }

  const handleProductInputChange = (e) => {
    const { name, value } = e.target
    setProductForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...productForm.imageUrls]
    newUrls[index] = value
    setProductForm(prev => ({ ...prev, imageUrls: newUrls }))
  }

  const handleAddImageUrl = () => {
    setProductForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }))
  }

  const handleRemoveImageUrl = (index) => {
    const newUrls = productForm.imageUrls.filter((_, i) => i !== index)
    setProductForm(prev => ({ ...prev, imageUrls: newUrls.length ? newUrls : [''] }))
  }

  const handleFileUpload = async (index, file) => {
    if (!file) return
    try {
      setUploadingIndex(index)
      const res = await productApi.uploadImage(file)
      if (res && res.data && res.data.url) {
        handleImageUrlChange(index, res.data.url)
        toast.success('Tải ảnh lên thành công!')
      }
    } catch (err) {
      console.error('Lỗi khi upload ảnh:', err)
      toast.error('Lỗi khi tải ảnh lên server!')
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    if (!productForm.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm')
      return
    }
    if (!productForm.baseprice || Number(productForm.baseprice) <= 0) {
      toast.error('Giá sản phẩm phải lớn hơn 0')
      return
    }
    if (!productForm.categoryId) {
      toast.error('Vui lòng chọn danh mục')
      return
    }

    const cleanImageUrls = productForm.imageUrls.map(u => u.trim()).filter(Boolean)

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      baseprice: Number(productForm.baseprice),
      categoryId: Number(productForm.categoryId),
      imageUrls: cleanImageUrls,
      colors: selectedColors,
      sizes: selectedSizes
    }

    try {
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.productId, payload)
        toast.success('Cập nhật sản phẩm thành công!')
      } else {
        await productApi.createProduct(payload)
        toast.success('Tạo sản phẩm mới và tự động tạo biến thể thành công!')
      }
      setIsProductModalOpen(false)
      fetchProducts()
    } catch (err) {
      console.error('Error saving product:', err)
      toast.error(err.response?.data?.message || 'Lỗi khi lưu sản phẩm.')
    }
  }

  const handleDeleteProduct = (productId) => {
    openConfirm(
      'Xóa sản phẩm',
      'Bạn có chắc chắn muốn xóa sản phẩm này? Các biến thể liên quan cũng sẽ bị ẩn.',
      async () => {
        try {
          await productApi.deleteProduct(productId)
          toast.success('Đã xóa sản phẩm thành công!')
          fetchProducts()
          if (selectedProductForVariants?.productId === productId) {
            setSelectedProductForVariants(null)
          }
        } catch (err) {
          console.error('Error deleting product:', err)
          let rawMsg = err.response?.data?.message || err.response?.data?.error || ''
          if (rawMsg.includes('còn tồn kho')) {
            const match = rawMsg.match(/còn tồn kho:\s*(\d+)/i)
            const stockCount = match ? match[1] : ''
            rawMsg = `Sản phẩm hiện vẫn còn hàng trong kho${stockCount ? ` (${stockCount} sản phẩm)` : ''}. Vui lòng cập nhật số lượng tồn kho về 0 trước khi xóa!`
          } else if (!rawMsg) {
            rawMsg = 'Sản phẩm vẫn còn hàng trong kho. Vui lòng kiểm tra lại trước khi xóa!'
          }
          toast.error(rawMsg)
        }
      },
      true
    )
  }

  const handleRestoreProduct = async (productId) => {
    try {
      await productApi.restoreProduct(productId)
      toast.success('Phục hồi sản phẩm thành công!')
      fetchProducts()
    } catch (err) {
      console.error('Error restoring product:', err)
      toast.error('Lỗi khi phục hồi sản phẩm.')
    }
  }

  // --- VARIANT ACTIONS ---

  const handleSelectProductVariants = async (product) => {
    try {
      const res = await productApi.getProductDetail(product.productId)
      if (res && res.data) {
        setSelectedProductForVariants(res.data)
      }
    } catch (err) {
      console.error('Error fetching variants:', err)
      toast.error('Không thể tải danh sách biến thể.')
    }
  }

  const handleOpenVariantModal = (variant = null) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (!selectedProductForVariants) return

    if (variant) {
      setEditingVariant(variant)
      setVariantForm({
        size: variant.size || 'S',
        color: variant.color || 'Trắng',
        price: variant.price || selectedProductForVariants.baseprice || '',
        quantityInStock: variant.quantityInStock !== undefined ? variant.quantityInStock : 10,
        sku: variant.sku || ''
      })
    } else {
      setEditingVariant(null)
      const randomSku = `SKU-${selectedProductForVariants.productId}-${Math.floor(1000 + Math.random() * 9000)}`
      setVariantForm({
        size: 'S',
        color: 'Trắng',
        price: selectedProductForVariants.baseprice || '',
        quantityInStock: 10,
        sku: randomSku
      })
    }
    setIsVariantModalOpen(true)
  }

  const handleVariantInputChange = (e) => {
    const { name, value } = e.target
    setVariantForm(prev => ({ ...prev, [name]: value }))
  }

  const handleVariantSubmit = async (e) => {
    e.preventDefault()
    if (!variantForm.price || Number(variantForm.price) <= 0) {
      toast.error('Giá bán biến thể phải lớn hơn 0')
      return
    }

    const payload = {
      size: variantForm.size,
      color: variantForm.color,
      price: Number(variantForm.price),
      quantityInStock: Number(variantForm.quantityInStock),
      sku: variantForm.sku
    }

    try {
      const prodId = selectedProductForVariants.productId
      if (editingVariant) {
        await productApi.updateVariant(prodId, editingVariant.productVariantId, payload)
        toast.success('Cập nhật biến thể thành công!')
      } else {
        await productApi.addVariant(prodId, payload)
        toast.success('Thêm biến thể thành công!')
      }
      setIsVariantModalOpen(false)
      handleSelectProductVariants({ productId: prodId })
    } catch (err) {
      console.error('Error saving variant:', err)
      toast.error(err.response?.data?.message || 'Lỗi khi lưu biến thể.')
    }
  }

  const handleDeleteVariant = (variantId) => {
    openConfirm(
      'Xóa biến thể',
      'Bạn có chắc chắn muốn xóa biến thể này?',
      async () => {
        try {
          const prodId = selectedProductForVariants.productId
          await productApi.deleteVariant(prodId, variantId)
          toast.success('Đã xóa biến thể thành công!')
          handleSelectProductVariants({ productId: prodId })
        } catch (err) {
          console.error('Error deleting variant:', err)
          toast.error('Lỗi khi xóa biến thể.')
        }
      },
      true
    )
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
      
      {/* ─── TITLE BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-brand-charcoal flex items-center gap-2">
            <span className="p-2 bg-brand-cream rounded-xl text-brand-charcoal text-lg">🛍️</span>
            Quản lý sản phẩm & biến thể
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Danh sách tất cả các mặt hàng thời trang, ảnh minh họa, tồn kho và biến thể chi tiết
          </p>
        </div>
        <button
          onClick={() => handleOpenProductModal()}
          className="bg-brand-charcoal text-white text-xs font-bold tracking-wider uppercase px-5 py-3 rounded-xl hover:bg-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
        >
          <span>✨</span> Thêm sản phẩm mới
        </button>
      </div>

      {/* ─── MAIN RESPONSIVE GRID LAYOUT (7:5 PROPORTION) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── LEFT: PRODUCTS TABLE (7 COLS) ─── */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Search Bar & Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (page === 0) fetchProducts()
                else setPage(0)
              }}
              className="flex gap-2 w-full"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm theo tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal focus:ring-2 focus:ring-brand-charcoal/10 text-xs font-sans placeholder-gray-400 bg-white"
                />
                <span className="absolute left-3 top-2 text-xs text-gray-400">🔍</span>
              </div>
              <button
                type="submit"
                className="bg-brand-charcoal hover:bg-black text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition-all active:scale-95 shrink-0"
              >
                Tìm
              </button>
              {searchQuery.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-medium px-3 py-2 rounded-xl cursor-pointer transition-colors shrink-0"
                >
                  Xóa lọc
                </button>
              )}
            </form>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-[11px] font-semibold tracking-wider uppercase border-b border-gray-100">
                  <th className="py-3.5 px-4 w-16">Ảnh</th>
                  <th className="py-3.5 px-4">Tên sản phẩm</th>
                  <th className="py-3.5 px-4 w-28">Giá niêm yết</th>
                  <th className="py-3.5 px-4 w-32">Danh mục</th>
                  <th className="py-3.5 px-4 w-24 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 w-28 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-brand-muted">
                      <div className="flex items-center justify-center gap-2">
                        <span className="inline-block animate-spin text-base">⏳</span>
                        Đang tải danh sách sản phẩm...
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-brand-muted font-medium">
                      Chưa có sản phẩm nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isSelected = selectedProductForVariants?.productId === p.productId
                    return (
                      <tr
                        key={p.productId}
                        onClick={() => handleSelectProductVariants(p)}
                        className={`hover:bg-brand-cream/20 transition-colors cursor-pointer ${
                          isSelected ? 'bg-amber-50/80 font-medium border-l-4 border-l-brand-charcoal' : ''
                        }`}
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <img
                            src={
                              p.imageUrls && p.imageUrls[0]
                                ? p.imageUrls[0]
                                : 'https://placehold.co/200x200/faf8f6/a3a3c2?text=No+Image'
                            }
                            alt=""
                            className="w-11 h-11 object-cover rounded-xl border border-gray-100 shadow-xs hover:scale-105 transition-transform"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-brand-charcoal leading-tight">{p.name}</p>
                          <p className="text-[10px] text-brand-muted mt-0.5 font-mono">Mã SP: #{p.productId}</p>
                          {(p.createdAt || p.updatedAt) && (
                            <div className="text-[9.5px] text-gray-500 mt-1 font-normal space-y-0.5 select-none normal-case">
                              {p.createdAt && (
                                <p>Tạo: {p.createdBy || 'Hệ thống'} ({new Date(p.createdAt).toLocaleString('vi-VN')})</p>
                              )}
                              {p.updatedAt && (p.lastModifiedBy || p.updatedAt !== p.createdAt) && (
                                <p>Sửa: {p.lastModifiedBy || 'Hệ thống'} ({new Date(p.updatedAt).toLocaleString('vi-VN')})</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-brand-charcoal">
                          {formatVND(p.baseprice)}
                        </td>
                        <td className="py-3 px-4 text-brand-muted font-medium">
                          <span className="inline-block bg-gray-100 px-2 py-0.5 rounded-lg text-[10px] text-gray-700">
                            {p.categoryName || 'Không có'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.deleted ? (
                            <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold bg-red-50 text-red-600 rounded-full border border-red-200">
                              Đã ẩn
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                              Đang bán
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenProductModal(p)}
                            className="text-[11px] font-semibold text-brand-charcoal hover:underline"
                          >
                            Sửa
                          </button>
                          <span className="text-gray-300">|</span>
                          {p.deleted ? (
                            <button
                              onClick={() => handleRestoreProduct(p.productId)}
                              className="text-[11px] font-semibold text-emerald-700 hover:underline"
                            >
                              Hiện
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteProduct(p.productId)}
                              className="text-[11px] font-semibold text-red-600 hover:underline"
                            >
                              Xóa
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Full Interactive Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-t border-gray-100 bg-gray-50/60 text-xs gap-3 mt-auto">
            <div className="flex items-center gap-2 text-gray-600 font-medium">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(0)
                }}
                className="px-2 py-1 border border-gray-200 rounded-lg bg-white text-xs font-semibold focus:outline-none focus:border-brand-charcoal"
              >
                <option value={5}>5 sản phẩm/trang</option>
                <option value={10}>10 sản phẩm/trang</option>
                <option value={20}>20 sản phẩm/trang</option>
                <option value={50}>50 sản phẩm/trang</option>
              </select>
              <span className="text-gray-400">| Tổng: <strong>{totalElements}</strong> sản phẩm</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors font-semibold text-gray-700"
              >
                ← Trước
              </button>
              
              {/* Numbered page buttons */}
              {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    page === pageNum
                      ? 'bg-brand-charcoal text-white shadow-xs'
                      : 'border border-gray-200 hover:bg-white text-gray-700'
                  }`}
                >
                  {pageNum + 1}
                </button>
              ))}

              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors font-semibold text-gray-700"
              >
                Sau →
              </button>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: VARIANTS LIST (5 COLS) ─── */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4 min-h-[450px] flex flex-col">
          {selectedProductForVariants ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Variant Section Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted block">
                    Danh sách biến thể
                  </span>
                  <h3 className="text-sm font-bold text-brand-charcoal mt-0.5 line-clamp-1">
                    {selectedProductForVariants.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Giá niêm yết: <strong className="text-brand-charcoal">{formatVND(selectedProductForVariants.baseprice)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => handleOpenVariantModal()}
                  className="bg-brand-charcoal hover:bg-black text-white text-xs font-semibold px-3.5 py-2 rounded-xl cursor-pointer transition-all shadow-sm active:scale-95 flex items-center gap-1 shrink-0"
                >
                  <span>+</span> Thêm biến thể
                </button>
              </div>

              {/* Variants Table */}
              {!selectedProductForVariants.variants || selectedProductForVariants.variants.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                  <span className="text-2xl mb-1">🏷️</span>
                  <p className="text-xs font-medium text-gray-600 mb-1">Chưa có biến thể nào</p>
                  <p className="text-[11px] text-gray-400 max-w-[220px]">
                    Hãy bấm nút &quot;Thêm biến thể&quot; để thiết lập kích cỡ, màu sắc và số lượng tồn kho.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] tracking-wider uppercase font-semibold text-gray-500 bg-gray-50/50">
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Màu sắc</th>
                        <th className="py-2.5 px-3">Giá bán</th>
                        <th className="py-2.5 px-3 text-center">Tồn kho</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedProductForVariants.variants.map((v) => (
                        <tr key={v.productVariantId} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-brand-charcoal">{v.size}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-3 h-3 rounded-full ${getColorDot(v.color)}`} />
                              <span className="text-gray-700 font-medium">{translateColor(v.color)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-brand-charcoal">
                            {formatVND(v.price)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                v.quantityInStock <= 5
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : v.quantityInStock <= 15
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {v.quantityInStock} sp
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-2">
                            <button
                              onClick={() => handleOpenVariantModal(v)}
                              className="text-[11px] font-semibold text-brand-charcoal hover:underline"
                            >
                              Sửa
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleDeleteVariant(v.productVariantId)}
                              className="text-[11px] font-semibold text-red-600 hover:underline"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <span className="text-3xl mb-2">👈</span>
              <h4 className="text-sm font-semibold text-brand-charcoal mb-1">
                Chọn sản phẩm để xem biến thể
              </h4>
              <p className="text-[11px] text-gray-400 max-w-[240px]">
                Bấm vào một hàng sản phẩm ở bảng bên trái để kiểm tra và chỉnh sửa tồn kho, kích thước hoặc màu sắc.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: PRODUCT CREATE / UPDATE (PERFECTLY CENTERED IN VIEWPORT) ─── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative my-auto w-full max-w-xl bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 md:p-8 space-y-6 max-h-[88vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-brand-charcoal">
                  {editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Điền đầy đủ thông tin chi tiết của sản phẩm</p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold uppercase text-brand-muted text-[10px]">Tên sản phẩm *</label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductInputChange}
                  placeholder="Ví dụ: Đầm Lụa Midi Outta"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal focus:ring-2 focus:ring-brand-charcoal/10 font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Giá niêm yết (VND) *</label>
                  <input
                    type="number"
                    name="baseprice"
                    value={productForm.baseprice}
                    onChange={handleProductInputChange}
                    placeholder="Ví dụ: 890000"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal focus:ring-2 focus:ring-brand-charcoal/10 font-sans"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Danh mục *</label>
                  <select
                    name="categoryId"
                    value={productForm.categoryId}
                    onChange={handleProductInputChange}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal focus:ring-2 focus:ring-brand-charcoal/10 font-sans bg-white"
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => {
                      const catVal = c.id !== undefined ? c.id : c.categoryId
                      return (
                        <option key={catVal} value={catVal}>
                          {c.name}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold uppercase text-brand-muted text-[10px]">Mô tả sản phẩm</label>
                <textarea
                  name="description"
                  rows="3"
                  value={productForm.description}
                  onChange={handleProductInputChange}
                  placeholder="Nhập mô tả chất liệu, kiểu dáng, cách bảo quản..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal focus:ring-2 focus:ring-brand-charcoal/10 font-sans resize-none"
                />
              </div>

              {/* Dynamic Image URLs */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">
                    Hình ảnh minh họa (Đường dẫn URL hoặc Tải tệp lên)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="text-[11px] font-semibold text-brand-charcoal hover:underline"
                  >
                    + Thêm đường dẫn ảnh
                  </button>
                </div>
                {productForm.imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal text-xs font-sans"
                    />
                    <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl cursor-pointer text-xs font-medium transition-colors shrink-0">
                      {uploadingIndex === index ? '⌛ Tải...' : '📁 Tải lên'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(index, e.target.files[0])}
                      />
                    </label>
                    {productForm.imageUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImageUrl(index)}
                        className="text-red-500 hover:text-red-700 px-2 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-charcoal text-white text-xs font-semibold hover:bg-black transition-all shadow-md active:scale-95"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: VARIANT CREATE / UPDATE (PERFECTLY CENTERED IN VIEWPORT) ─── */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative my-auto w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 md:p-8 space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-brand-charcoal">
                  {editingVariant ? 'Cập nhật biến thể' : 'Thêm biến thể mới'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thiết lập kích cỡ, màu sắc & tồn kho cho sản phẩm
                </p>
              </div>
              <button
                onClick={() => setIsVariantModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVariantSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Kích cỡ (Size) *</label>
                  <select
                    name="size"
                    value={variantForm.size}
                    onChange={handleVariantInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal focus:ring-2 focus:ring-brand-charcoal/10 font-sans bg-white"
                    required
                  >
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '35', '36', '37', '38', '39', '40', 'OS'].map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Màu sắc *</label>
                  <select
                    name="color"
                    value={variantForm.color}
                    onChange={handleVariantInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal focus:ring-2 focus:ring-brand-charcoal/10 font-sans bg-white"
                    required
                  >
                    {[
                      { value: 'Trắng', label: 'Trắng' },
                      { value: 'Đen', label: 'Đen' },
                      { value: 'Hồng', label: 'Hồng' },
                      { value: 'Be', label: 'Be' },
                      { value: 'Nâu', label: 'Nâu' },
                      { value: 'Xám', label: 'Xám' },
                      { value: 'Đỏ', label: 'Đỏ' },
                      { value: 'Xanh', label: 'Xanh' },
                      { value: 'Vàng', label: 'Vàng' },
                      { value: 'Charcoal', label: 'Charcoal' }
                    ].map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Giá bán (VND) *</label>
                  <input
                    type="number"
                    name="price"
                    value={variantForm.price}
                    onChange={handleVariantInputChange}
                    placeholder="Nhập giá bán"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal focus:ring-2 focus:ring-brand-charcoal/10 font-sans"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    name="quantityInStock"
                    value={variantForm.quantityInStock}
                    onChange={handleVariantInputChange}
                    placeholder="Ví dụ: 100"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal focus:ring-2 focus:ring-brand-charcoal/10 font-sans"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Mã SKU sản phẩm</label>
                  <span className="text-[9px] text-brand-muted uppercase font-normal">(Tự động tạo)</span>
                </div>
                <input
                  type="text"
                  name="sku"
                  value={variantForm.sku}
                  onChange={handleVariantInputChange}
                  placeholder="SKU-..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-charcoal bg-gray-50 text-gray-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-charcoal text-white text-xs font-semibold hover:bg-black transition-all shadow-md active:scale-95"
                >
                  Lưu biến thể
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  )
}
