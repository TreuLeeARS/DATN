import axiosClient from './axiosClient';

const invoiceApi = {
  // Lấy danh sách hóa đơn phân trang (Admin/Staff)
  getInvoices: (params) => {
    // params: { page, size }
    return axiosClient.get('/invoices', { params });
  },

  // Lấy chi tiết hóa đơn (Admin/Staff/User)
  getInvoiceById: (invoiceId) => {
    return axiosClient.get(`/invoices/${invoiceId}`);
  },

  // Lấy danh sách hóa đơn của bản thân (User)
  getMyInvoices: () => {
    return axiosClient.get('/invoices/my');
  }
};

export default invoiceApi;
