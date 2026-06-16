import axiosClient from './axiosClient';

const authApi = {
  // Gửi thông tin đăng nhập
  login: (credentials) => {
    // credentials: { email, password }
    return axiosClient.post('/auth/login', credentials);
  },

  // Đăng ký tài khoản mới
  register: (userData) => {
    // userData: { name, email, password, ... }
    return axiosClient.post('/auth/register', userData);
  },

  // Lấy thông tin người dùng hiện tại
  getProfile: () => {
    return axiosClient.get('/auth/profile');
  },
};

export default authApi;
