import axiosClient from './axiosClient';

const paymentApi = {
  // Tạo thanh toán COD
  createCodPayment: (data) => {
    // data: { orderId, amount }
    return axiosClient.post('/payments/cod', data);
  },

  // ADMIN/STAFF: Xác nhận thanh toán COD
  confirmCodPayment: (paymentId) => {
    return axiosClient.put(`/payments/cod/${paymentId}/confirm`);
  },

  // Lấy thông tin thanh toán theo ID đơn hàng
  getPaymentByOrderId: (orderId) => {
    return axiosClient.get(`/payments/${orderId}`);
  },

  // Lấy trạng thái thanh toán theo ID đơn hàng
  getPaymentStatusByOrderId: (orderId) => {
    return axiosClient.get(`/payments/status/${orderId}`);
  }
};

export default paymentApi;
