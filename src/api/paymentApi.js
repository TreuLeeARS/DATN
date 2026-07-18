import axiosClient from './axiosClient';

const paymentApi = {
  // Lấy danh sách phương thức thanh toán do BE cấu hình
  getPaymentMethods: () => {
    return axiosClient.get('/payment-methods');
  },

  // Tạo thanh toán COD
  createCodPayment: (data) => {
    // data: { orderId } theo CreateCodPaymentRequest của BE; BE tự lấy totalAmount từ order.
    return axiosClient.post('/payments/cod', data);
  },

  // Tạo phiên thanh toán MoMo cho một đơn CREATED chưa có payment.
  // Response Momo hiện không bọc BaseResponse, chứa payUrl trực tiếp.
  createMomoPayment: (orderId) => axiosClient.post('/momo/create', { orderId }),

  // ADMIN/STAFF: Xác nhận thanh toán COD
  confirmCodPayment: (paymentId) => {
    return axiosClient.put(`/payments/cod/${paymentId}/confirm`);
  },

  // Lấy thông tin thanh toán theo ID đơn hàng
  getPaymentByOrderId: (orderId) => {
    return axiosClient.get(`/payments/${orderId}`);
  },

  // BE nhận ID đơn hàng hoặc mã MoMo dạng BEE_STORE_{paymentId}
  getPaymentStatusByOrderId: (orderOrMomoPaymentId) => {
    return axiosClient.get(`/payments/status/${orderOrMomoPaymentId}`);
  }
};

export default paymentApi;
