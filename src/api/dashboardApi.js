import axiosClient from './axiosClient';

const dashboardApi = {
  // Lấy tổng quan dashboard
  getSummary: () => {
    return axiosClient.get('/admin/dashboard/summary');
  },

  // Lấy danh sách sản phẩm bán chạy
  getBestSellers: (from, to, limit = 10) => {
    return axiosClient.get('/admin/dashboard/best-sellers', {
      params: { from, to, limit }
    });
  },

  // Thống kê doanh thu theo ngày
  getRevenueDaily: (from, to) => {
    return axiosClient.get('/admin/dashboard/revenue/daily', {
      params: { from, to }
    });
  },

  // Thống kê doanh thu theo tháng
  getRevenueMonthly: (from, to) => {
    return axiosClient.get('/admin/dashboard/revenue/monthly', {
      params: { from, to }
    });
  }
};

export default dashboardApi;
