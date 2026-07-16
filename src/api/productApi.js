import axiosClient from './axiosClient';

const productApi = {
  // Lấy danh sách sản phẩm (phân trang)
  getAllProducts: (params) => {
    return axiosClient.get('/products', { params });
  },

  // Lấy chi tiết sản phẩm
  getProductDetail: (id) => {
    return axiosClient.get(`/products/${id}`);
  },

  // Tìm kiếm và lọc sản phẩm
  searchProducts: (params) => {
    // params: { name, categoryId, minPrice, maxPrice, page, size, sort }
    return axiosClient.get('/products/search', { params });
  },

  // Lấy sản phẩm theo category ID
  getProductsByCategory: (categoryId, params) => {
    return axiosClient.get(`/products/categories/${categoryId}/products`, { params });
  },

  // ================= ADMIN ENDPOINTS =================

  // Admin lấy tất cả sản phẩm (bao gồm cả sản phẩm xóa mềm)
  getAllProductsForAdmin: (params) => {
    return axiosClient.get('/products/admin', { params });
  },

  // Admin lấy chi tiết sản phẩm (bao gồm cả sản phẩm xóa mềm)
  getDetailForAdmin: (id) => {
    return axiosClient.get(`/products/admin/${id}`);
  },

  // Admin tạo mới sản phẩm
  createProduct: (data) => {
    return axiosClient.post('/products', data);
  },

  // Admin cập nhật thông tin sản phẩm
  updateProduct: (id, data) => {
    return axiosClient.put(`/products/${id}`, data);
  },

  // Admin xóa mềm sản phẩm
  deleteProduct: (id) => {
    return axiosClient.delete(`/products/${id}`);
  },

  // Admin khôi phục sản phẩm đã xóa mềm
  restoreProduct: (id) => {
    return axiosClient.put(`/products/${id}/restore`);
  },

  // Admin thêm biến thể cho sản phẩm
  addVariant: (productId, data) => {
    return axiosClient.post(`/products/${productId}/variants`, data);
  },

  // Admin cập nhật biến thể sản phẩm
  updateVariant: (productId, variantId, data) => {
    return axiosClient.put(`/products/${productId}/variants/${variantId}`, data);
  },

  // Admin xóa biến thể sản phẩm
  deleteVariant: (productId, variantId) => {
    return axiosClient.delete(`/products/${productId}/variants/${variantId}`);
  },

  // BE chỉ quản lý ảnh bằng URL, không có endpoint upload file nhị phân.
  addImages: (productId, imageUrls) => {
    return axiosClient.post(`/products/${productId}/images`, { imageUrls });
  },

  deleteImageByUrl: (productId, imageUrl) => {
    return axiosClient.delete(`/products/${productId}/images`, {
      params: { imageUrl },
    });
  }
};

export default productApi;
