import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1')
  .replace(/\/+$/, '');

// Tạo một instance của axios với cấu hình mặc định
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
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
    } else {
      // Không để header mặc định cũ tiếp tục tồn tại sau logout/hết phiên.
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Biến theo dõi trạng thái đang refresh và hàng đợi lưu các request bị dừng chờ refresh xong
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  delete axiosClient.defaults.headers.common.Authorization;
};

const redirectToLogin = (message = 'Phiên đăng nhập đã hết hạn hoặc không còn hợp lệ. Vui lòng đăng nhập lại.') => {
  if (window.location.pathname === '/auth') return;

  sessionStorage.setItem('authFlashMessage', message);
  sessionStorage.setItem(
    'authRedirectUrl',
    `${window.location.pathname}${window.location.search}`
  );
  window.location.href = '/auth';
};

const createRefreshRejectedError = (message) => {
  const error = new Error(message || 'Refresh token không còn hợp lệ');
  error.code = 'REFRESH_TOKEN_REJECTED';
  return error;
};

const shouldClearAuthSession = (error) => {
  if (error?.code === 'REFRESH_TOKEN_REJECTED') return true;

  const status = error?.response?.status;
  if ([401, 403].includes(status)) return true;

  // BE có chỗ đang quy đổi lỗi hệ thống thành HTTP 400, nên chỉ coi 400 là
  // lỗi phiên khi body cũng xác nhận request thất bại.
  return status === 400 && error?.response?.data?.success === false;
};

// Response Interceptor: Xử lý dữ liệu trả về và lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp data nhận được từ API để không cần gõ response.data ở bên ngoài
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Xử lý lỗi toàn cục (Global Error Handling)
    if (error.response) {
      const { status, data } = error.response;
      
      // Token mới vẫn bị từ chối sau khi retry: phiên không thể phục hồi.
      if (status === 401 && originalRequest?._retry) {
        clearAuthSession();
        redirectToLogin('Không thể làm mới phiên đăng nhập. Vui lòng đăng nhập lại.');
        return Promise.reject(error);
      }

      // Nếu gặp lỗi 401 Unauthorized và request chưa từng được retry
      if (status === 401 && originalRequest && !originalRequest._retry) {
        // Tránh lặp vô tận nếu API bị lỗi chính là đăng nhập hoặc làm mới token
        const requestUrl = originalRequest.url || '';
        if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        // Nếu đang trong quá trình refresh token từ request trước đó, xếp request hiện tại vào hàng đợi
        if (isRefreshing) {
          originalRequest._retry = true;
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosClient(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          const missingRefreshTokenError = createRefreshRejectedError('Không tìm thấy refresh token');
          processQueue(missingRefreshTokenError, null);
          isRefreshing = false;
          clearAuthSession();
          redirectToLogin();
          return Promise.reject(missingRefreshTokenError);
        }

        try {
          // Gọi API refresh token sử dụng axios gốc để tránh lặp interceptor
          const res = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { timeout: axiosClient.defaults.timeout }
          );

          const payload = res.data;

          // BE hiện có thể trả HTTP 200 kèm success=false khi refresh token bị từ chối.
          if (payload?.success === false) {
            throw createRefreshRejectedError(payload.message);
          }

          const { accessToken, refreshToken: newRefreshToken } = payload?.data || {};
          if (!accessToken) {
            // Sai contract hoặc lỗi tạm thời từ server chưa đủ căn cứ để xóa phiên đăng nhập.
            throw new Error('Response refresh thiếu accessToken');
          }

          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Request gốc cần token mới; request kế tiếp sẽ đọc token từ localStorage.
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Giải phóng hàng đợi chờ
          processQueue(null, accessToken);
          isRefreshing = false;

          // Thực hiện lại request ban đầu với token mới
          return axiosClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          if (shouldClearAuthSession(refreshError)) {
            // Chỉ kết thúc phiên khi server xác nhận refresh token không còn hợp lệ.
            clearAuthSession();
            redirectToLogin();
          } else {
            // Network error, timeout, HTTP 5xx hoặc response sai contract là lỗi tạm thời.
            // Giữ token để người dùng có thể thử lại khi server hoạt động ổn định.
            console.error('Không thể refresh token do lỗi tạm thời:', refreshError);
          }

          return Promise.reject(refreshError);
        }
      }

      switch (status) {
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
