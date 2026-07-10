export const isAdmin = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const roles = payload.roles || payload.authorities || payload.role || [];
    
    return Array.isArray(roles)
      ? roles.some(r => typeof r === 'string' && r.toUpperCase().includes('ADMIN'))
      : typeof roles === 'string' && roles.toUpperCase().includes('ADMIN');
  } catch (e) {
    return false;
  }
};

/**
 * Kiểm tra trạng thái đăng nhập dựa trên sự tồn tại của accessToken.
 * Dùng hàm này thay vì gán const để tránh stale closure.
 */
export const getIsLoggedIn = () => !!localStorage.getItem('accessToken');

export const isStaff = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const roles = payload.roles || payload.authorities || payload.role || [];
    
    const checkRole = (r) => typeof r === 'string' && (r.toUpperCase().includes('STAFF') || r.toUpperCase().includes('EMPLOYEE'));
    return Array.isArray(roles)
      ? roles.some(checkRole)
      : typeof roles === 'string' && checkRole(roles);
  } catch (e) {
    return false;
  }
};

export const isAdminOrStaff = () => isAdmin() || isStaff();

