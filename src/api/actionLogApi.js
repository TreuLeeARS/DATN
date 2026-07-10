import axiosClient from './axiosClient';

const actionLogApi = {
  // Lấy danh sách nhật ký hoạt động phân trang (Admin chỉ định)
  getLogs: (params) => {
    // params: { page, size }
    // API endpoint của BE là /api/admin/action-logs (không có v1)
    const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1').replace(/\/v1\/?$/, '');
    return axiosClient.get('/admin/action-logs', {
      baseURL: baseApi,
      params
    });
  }
};

export default actionLogApi;
