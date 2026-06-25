import axiosClient from './axiosClient';

const categoryApi = {
  // Lấy danh sách tất cả danh mục phân trang
  getAllCategories: (params) => {
    return axiosClient.get('/categorys', { params });
  },

  // Lấy các danh mục gốc (không có parent)
  getRootCategories: () => {
    return axiosClient.get('/categorys/root');
  },

  // Lấy danh mục con theo parent ID
  getCategoriesByParent: (parentId) => {
    return axiosClient.get(`/categorys/${parentId}`);
  },

  // ADMIN: Tạo danh mục mới
  createCategory: (data) => {
    return axiosClient.post('/categorys', data);
  },

  // ADMIN: Xóa danh mục theo ID
  deleteCategory: (id) => {
    return axiosClient.delete(`/categorys/${id}`);
  }
};

export default categoryApi;
