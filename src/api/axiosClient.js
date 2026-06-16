import axios from 'axios';

// Tạo một instance của axios với cấu hình mặc định
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1', // Đường dẫn API từ Spring Boot/Node.js của bạn
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Hủy request nếu phản hồi lâu hơn 10 giây
});

// Request Interceptor: Tự động đính kèm Token trước khi gửi request
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (hoặc redux store, cookie, v.v...)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý dữ liệu trả về và lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp data nhận được từ API để không cần gõ response.data ở bên ngoài
    return response.data;
  },
  (error) => {
    // Xử lý lỗi toàn cục (Global Error Handling)
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Ví dụ: Logout user nếu token hết hạn
          console.error('Unauthorized - Vui lòng đăng nhập lại.');
          localStorage.removeItem('accessToken');
          // Bạn có thể redirect user về trang login ở đây nếu cần thiết
          break;
        case 403:
          console.error('Forbidden - Bạn không có quyền truy cập tài nguyên này.');
          break;
        case 404:
          console.error('Not Found - Không tìm thấy tài nguyên.');
          break;
        case 500:
          console.error('Internal Server Error - Lỗi hệ thống.');
          break;
        default:
          console.error(data?.message || 'Đã xảy ra lỗi không xác định.');
      }
    } else if (error.request) {
      // Lỗi do không kết nối được tới server
      console.error('Network Error - Không thể kết nối đến máy chủ.');
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
