import axiosClient from './axiosClient';

const couponApi = {
  // Lấy danh sách coupon phân trang (cho khách hàng hoặc thông thường)
  getCoupons: (params) => {
    return axiosClient.get('/coupons', { params });
  },

  // BE chưa có endpoint tra cứu trực tiếp theo mã. Duyệt đủ các trang để không
  // kết luận sai rằng coupon không tồn tại chỉ vì nó nằm sau 100 bản ghi đầu.
  findCouponByCode: async (couponCode) => {
    const normalizedCode = couponCode?.trim().toLowerCase();
    if (!normalizedCode) return null;

    const pageSize = 100;
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
      const response = await axiosClient.get('/coupons', {
        params: { page, size: pageSize, sort: 'couponId,desc' }
      });
      const pageData = response?.data;
      const coupons = Array.isArray(pageData?.content) ? pageData.content : [];
      const found = coupons.find(
        coupon => coupon?.couponCode?.trim().toLowerCase() === normalizedCode
      );

      if (found) return found;

      totalPages = Number.isInteger(pageData?.totalPages) ? pageData.totalPages : 0;
      page += 1;
    }

    return null;
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
  },

  // Phục hồi coupon đã xóa mềm (Admin)
  restoreCoupon: (id) => {
    return axiosClient.put(`/coupons/restore/${id}`);
  }
};

export default couponApi;
