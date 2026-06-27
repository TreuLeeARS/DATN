import { useState, useEffect } from 'react'
import { formatVND } from '../../utils/price.js'
import toast from 'react-hot-toast'
import productApi from '../../api/productApi'
import categoryApi from '../../api/categoryApi'

export const ProductManager = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null) // null for create, object for edit
  const [editingVariant, setEditingVariant] = useState(null) // null for create, object for edit
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null) // product detail object

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
    color: '',
    price: '',
    quantityInStock: 10,
    sku: ''
  })

  // Fetch categories & products on mount
  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [page])

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
      const res = await productApi.getAllProductsForAdmin({
        page: page,
        size: 10,
        sort: 'productId,desc'
      })
      if (res && res.data) {
        setProducts(res.data.content || [])
        setTotalPages(res.data.totalPages || 1)
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
    if (prod) {
      setEditingProduct(prod)
      setProductForm({
        name: prod.name,
        description: prod.description || '',
        baseprice: prod.baseprice,
        categoryId: prod.categoryId || '',
        imageUrls: prod.imageUrls && prod.imageUrls.length > 0 ? [...prod.imageUrls] : ['']
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '',
        description: '',
        baseprice: '',
        categoryId: categories[0]?.id || '',
        imageUrls: ['']
      })
    }
    setIsProductModalOpen(true)
  }

  const handleProductInputChange = (e) => {
    const { name, value } = e.target
    setProductForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUrlChange = (index, value) => {
    setProductForm(prev => {
      const newUrls = [...prev.imageUrls]
      newUrls[index] = value
      return { ...prev, imageUrls: newUrls }
    })
  }

  const handleAddImageField = () => {
    setProductForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }))
  }

  const handleRemoveImageField = (index) => {
    if (productForm.imageUrls.length <= 1) return
    setProductForm(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, idx) => idx !== index)
    }))
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    if (!productForm.name.trim() || !productForm.baseprice || !productForm.categoryId) {
      toast.error('Vui lòng điền đầy đủ các trường thông tin bắt buộc.')
      return
    }

    const payload = {
      name: productForm.name,
      description: productForm.description,
      baseprice: Number(productForm.baseprice),
      categoryId: Number(productForm.categoryId),
      imageUrls: productForm.imageUrls.filter(url => url.trim() !== '')
    }

    try {
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.productId, payload)
        toast.success('Cập nhật sản phẩm thành công!')
      } else {
        await productApi.createProduct({ ...payload, variants: [] })
        toast.success('Tạo sản phẩm mới thành công!')
      }
      setIsProductModalOpen(false)
      fetchProducts()
    } catch (err) {
      console.error('Error saving product:', err)
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm.')
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mềm sản phẩm này?')) return
    try {
      await productApi.deleteProduct(id)
      toast.success('Đã xóa mềm sản phẩm thành công!')
      fetchProducts()
      if (selectedProductForVariants?.productId === id) {
        setSelectedProductForVariants(null)
      }
    } catch (err) {
      console.error('Error deleting product:', err)
      toast.error('Lỗi khi xóa sản phẩm.')
    }
  }

  const handleRestoreProduct = async (id) => {
    try {
      await productApi.restoreProduct(id)
      toast.success('Khôi phục sản phẩm thành công!')
      fetchProducts()
    } catch (err) {
      console.error('Error restoring product:', err)
      toast.error('Lỗi khi khôi phục sản phẩm.')
    }
  }

  // --- VARIANTS CRUD ACTIONS ---

  const handleSelectProductVariants = async (prod) => {
    try {
      const res = await productApi.getDetailForAdmin(prod.productId)
      if (res && res.data) {
        setSelectedProductForVariants(res.data)
      }
    } catch (err) {
      console.error('Error loading product details:', err)
      toast.error('Không thể tải chi tiết biến thể sản phẩm.')
    }
  }

  const handleOpenVariantModal = (v = null) => {
    if (!selectedProductForVariants) return
    if (v) {
      setEditingVariant(v)
      setVariantForm({
        size: v.size,
        color: v.color,
        price: v.price || selectedProductForVariants.baseprice,
        quantityInStock: v.quantityInStock,
        sku: v.sku || ''
      })
    } else {
      setEditingVariant(null)
      setVariantForm({
        size: 'S',
        color: '',
        price: selectedProductForVariants.baseprice,
        quantityInStock: 100,
        sku: `SKU-${selectedProductForVariants.productId}-${Date.now().toString().slice(-4)}`
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
    if (!variantForm.color.trim() || !variantForm.size || !variantForm.price) {
      toast.error('Vui lòng điền đầy đủ thông tin biến thể.')
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
      handleSelectProductVariants({ productId: prodId }) // Refresh detailed view
    } catch (err) {
      console.error('Error saving variant:', err)
      toast.error(err.response?.data?.message || 'Lỗi khi lưu biến thể.')
    }
  }

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa biến thể này?')) return
    try {
      const prodId = selectedProductForVariants.productId
      await productApi.deleteVariant(prodId, variantId)
      toast.success('Đã xóa biến thể thành công!')
      handleSelectProductVariants({ productId: prodId })
    } catch (err) {
      console.error('Error deleting variant:', err)
      toast.error('Lỗi khi xóa biến thể.')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      
      {/* ─── TITLE BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-none border border-black/10 shadow-sm">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-brand-charcoal">Danh sách sản phẩm</h2>
          <p className="text-xs text-brand-muted mt-1">Quản lý các mặt hàng thời trang, ảnh minh họa và biến thể kho hàng</p>
        </div>
        <button
          onClick={() => handleOpenProductModal()}
          className="bg-brand-charcoal text-white text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-brand-dark transition-colors duration-200 active:scale-95 rounded-none cursor-pointer"
        >
          Thêm sản phẩm mới
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ─── LEFT: PRODUCTS TABLE ─── */}
        <div className="w-full lg:w-3/5 bg-white border border-black/10 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-charcoal text-white text-[10px] tracking-wider uppercase border-b border-black/10">
                  <th className="py-4 px-4 font-semibold w-16">Ảnh</th>
                  <th className="py-4 px-4 font-semibold">Tên sản phẩm</th>
                  <th className="py-4 px-4 font-semibold w-24">Giá cơ bản</th>
                  <th className="py-4 px-4 font-semibold w-32">Danh mục</th>
                  <th className="py-4 px-4 font-semibold w-24 text-center">Trạng thái</th>
                  <th className="py-4 px-4 font-semibold w-36 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-brand-muted">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin text-brand-charcoal" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang tải danh sách sản phẩm...
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-brand-muted font-medium">
                      Chưa có sản phẩm nào được lưu trữ trong cơ sở dữ liệu.
                    </td>
                  </tr>
                ) : (
                  products.map(p => {
                    const isSelected = selectedProductForVariants?.productId === p.productId
                    return (
                      <tr 
                        key={p.productId} 
                        className={`hover:bg-black/[0.01] transition-colors cursor-pointer ${isSelected ? 'bg-brand-blush/10 font-medium' : ''}`}
                        onClick={() => handleSelectProductVariants(p)}
                      >
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <img 
                            src={p.imageUrls && p.imageUrls[0] ? p.imageUrls[0] : 'https://placehold.co/200x200/faf8f6/a3a3c2?text=No+Image'} 
                            alt="" 
                            className="w-10 h-10 object-cover border border-gray-100 hover:scale-110 transition-transform duration-200"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-brand-charcoal hover:underline">{p.name}</p>
                          <p className="text-[10px] text-brand-muted mt-0.5">ID: {p.productId}</p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-brand-charcoal">
                          {formatVND(p.baseprice)}
                        </td>
                        <td className="py-3.5 px-4 text-brand-muted">
                          {p.categoryName || 'Không có'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {p.deleted ? (
                            <span className="inline-block px-2 py-0.5 text-[9px] font-semibold bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">Đã xóa</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-[9px] font-semibold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">Đang bán</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenProductModal(p)}
                            className="text-[10px] uppercase tracking-wider font-semibold text-brand-charcoal hover:underline"
                          >
                            Sửa
                          </button>
                          <span>|</span>
                          {p.deleted ? (
                            <button
                              onClick={() => handleRestoreProduct(p.productId)}
                              className="text-[10px] uppercase tracking-wider font-semibold text-green-700 hover:underline"
                            >
                              Phục hồi
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteProduct(p.productId)}
                              className="text-[10px] uppercase tracking-wider font-semibold text-red-700 hover:underline"
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-xs">
              <button
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                className="px-3 py-1.5 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
              >
                Trước
              </button>
              <span className="font-semibold text-brand-muted">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                className="px-3 py-1.5 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </div>

        {/* ─── RIGHT: VARIANTS LIST ─── */}
        <div className="w-full lg:w-2/5 bg-white border border-black/10 shadow-sm p-6 space-y-6 min-h-[400px]">
          {selectedProductForVariants ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">Biến thể của: {selectedProductForVariants.name}</h3>
                  <p className="text-[10px] text-brand-muted mt-1">Danh mục: {selectedProductForVariants.categoryName} • Giá cơ bản: {formatVND(selectedProductForVariants.baseprice)}</p>
                </div>
                <button
                  onClick={() => handleOpenVariantModal()}
                  className="bg-brand-charcoal hover:bg-brand-dark text-white text-[9px] font-bold tracking-widest uppercase px-3 py-2 rounded-none cursor-pointer"
                >
                  Thêm biến thể
                </button>
              </div>

              {/* Variants table */}
              {!selectedProductForVariants.variants || selectedProductForVariants.variants.length === 0 ? (
                <div className="text-center py-10 text-brand-muted text-xs border border-dashed border-gray-200">
                  Sản phẩm này hiện chưa cấu hình biến thể nào. Vui lòng bấm thêm biến thể kích cỡ/màu sắc.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] tracking-wider uppercase text-brand-muted">
                        <th className="py-2.5 font-semibold">Size</th>
                        <th className="py-2.5 font-semibold">Màu sắc</th>
                        <th className="py-2.5 font-semibold">Giá bán</th>
                        <th className="py-2.5 font-semibold text-center">Tồn kho</th>
                        <th className="py-2.5 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedProductForVariants.variants.map((v) => (
                        <tr key={v.productVariantId} className="hover:bg-gray-50/50">
                          <td className="py-3 font-semibold text-brand-charcoal">{v.size}</td>
                          <td className="py-3 text-brand-muted">{v.color}</td>
                          <td className="py-3 font-semibold text-brand-charcoal">{formatVND(v.price)}</td>
                          <td className="py-3 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              v.quantityInStock <= 10 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : 'bg-gray-50 text-brand-charcoal border border-gray-200'
                            }`}>
                              {v.quantityInStock}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            <button
                              onClick={() => handleOpenVariantModal(v)}
                              className="text-[9px] uppercase tracking-wider font-semibold text-brand-charcoal hover:underline"
                            >
                              Sửa
                            </button>
                            <span className="text-gray-200">|</span>
                            <button
                              onClick={() => handleDeleteVariant(v.productVariantId)}
                              className="text-[9px] uppercase tracking-wider font-semibold text-red-700 hover:underline"
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
            <div className="flex flex-col items-center justify-center py-20 text-center text-brand-muted">
              <svg className="w-10 h-10 mb-3 opacity-30 text-brand-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-sm font-semibold text-brand-charcoal mb-1">Xem chi tiết biến thể</h4>
              <p className="text-[11px] max-w-[240px]">Chọn một sản phẩm từ bảng bên trái để kiểm tra và chỉnh sửa tồn kho, kích thước hoặc màu sắc.</p>
            </div>
          )}
        </div>

      </div>

      {/* ─── MODAL: PRODUCT CREATE / UPDATE ─── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white border border-black/10 shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto rounded-none">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
                {editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-brand-charcoal text-sm hover:opacity-70 font-semibold">✕</button>
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
                  className="w-full p-2.5 border border-gray-200 focus:outline-none focus:border-brand-charcoal font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Giá cơ bản (VND) *</label>
                  <input
                    type="number"
                    name="baseprice"
                    value={productForm.baseprice}
                    onChange={handleProductInputChange}
                    placeholder="Ví dụ: 890000"
                    className="w-full p-2.5 border border-gray-200 focus:outline-none focus:border-brand-charcoal font-sans"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Danh mục *</label>
                  <select
                    name="categoryId"
                    value={productForm.categoryId}
                    onChange={handleProductInputChange}
                    className="w-full p-2.5 border border-gray-200 focus:outline-none focus:border-brand-charcoal font-sans bg-white"
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold uppercase text-brand-muted text-[10px]">Mô tả chi tiết</label>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleProductInputChange}
                  placeholder="Mô tả phong cách, chất liệu vải..."
                  rows="3"
                  className="w-full p-2.5 border border-gray-200 focus:outline-none focus:border-brand-charcoal font-sans resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Đường dẫn hình ảnh (URLs)</label>
                  <button
                    type="button"
                    onClick={handleAddImageField}
                    className="text-[10px] text-brand-charcoal font-semibold hover:underline"
                  >
                    + Thêm ảnh
                  </button>
                </div>
                <div className="space-y-2">
                  {productForm.imageUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 p-2 border border-gray-200 focus:outline-none focus:border-brand-charcoal font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImageField(idx)}
                        disabled={productForm.imageUrls.length <= 1}
                        className="text-red-600 hover:text-red-800 disabled:opacity-40 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 font-semibold hover:bg-gray-50 transition-colors uppercase tracking-wider rounded-none cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-charcoal text-white font-semibold hover:bg-brand-dark transition-colors uppercase tracking-wider rounded-none cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: VARIANT CREATE / UPDATE ─── */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-black/10 shadow-2xl p-6 space-y-6 rounded-none">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
                {editingVariant ? 'Cập nhật biến thể' : 'Thêm biến thể mới'}
              </h3>
              <button onClick={() => setIsVariantModalOpen(false)} className="text-brand-charcoal text-sm hover:opacity-70 font-semibold">✕</button>
            </div>

            <form onSubmit={handleVariantSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Kích cỡ (Size) *</label>
                  <select
                    name="size"
                    value={variantForm.size}
                    onChange={handleVariantInputChange}
                    className="w-full p-2.5 border border-gray-200 focus:outline-none focus:border-brand-charcoal font-sans bg-white"
                    required
                  >
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '35', '36', '37', '38', '39', '40', 'OS'].map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Màu sắc *</label>
                  <input
                    type="text"
                    name="color"
                    value={variantForm.color}
                    onChange={handleVariantInputChange}
                    placeholder="Ví dụ: Hồng Blush, Charcoal"
                    className="w-full p-2.5 border border-gray-200 focus:outline-none focus:border-brand-charcoal font-sans"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-brand-muted text-[10px]">Giá bán riêng (VND) *</label>
                  <input
                    type="number"
                    name="price"
                    value={variantForm.price}
                    onChange={handleVariantInputChange}
                    placeholder="Để trống lấy giá mặc định"
                    className="w-full p-2.5 border border-gray-200 focus:outline-none focus:border-brand-charcoal font-sans"
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
                    className="w-full p-2.5 border border-gray-200 focus:outline-none focus:border-brand-charcoal font-sans"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold uppercase text-brand-muted text-[10px]">SKU sản phẩm</label>
                <input
                  type="text"
                  name="sku"
                  value={variantForm.sku}
                  onChange={handleVariantInputChange}
                  placeholder="Ví dụ: SKU-OUTTA-01"
                  className="w-full p-2.5 border border-gray-200 focus:outline-none focus:border-brand-charcoal font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 font-semibold hover:bg-gray-50 transition-colors uppercase tracking-wider rounded-none cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-charcoal text-white font-semibold hover:bg-brand-dark transition-colors uppercase tracking-wider rounded-none cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
