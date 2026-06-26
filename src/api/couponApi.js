import axiosClient from './axiosClient';

const couponApi = {
  // Lấy danh sách coupon phân trang (cho khách hàng hoặc thông thường)
  getCoupons: (params) => {
    return axiosClient.get('/coupons', { params });
  },

  // Tạo mới coupon (Admin)
  createCoupon: (data) => {
    return axiosClient.post('/coupons', data);
  },

  // Xóa coupon theo id (Admin)
  deleteCoupon: (id) => {
    return axiosClient.delete('/coupons', {
      params: { id }
    });
  },

  // Admin lấy tất cả danh sách coupon (bao gồm cả đã xóa mềm)
  getCouponsForAdmin: (params) => {
    return axiosClient.get('/coupons/admin', { params });
  }
};

export default couponApi;
