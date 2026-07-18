export const decodeJwtPayload = (token) => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
};

const getRoles = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return [];
  try {
    const payload = decodeJwtPayload(token);
    if (!payload) return [];
    const roles = payload.roles || payload.authorities || payload.role || [];
    return Array.isArray(roles) ? roles : [roles];
  } catch {
    return [];
  }
};

export const isAdmin = () => getRoles().some(
  role => typeof role === 'string' && role.toUpperCase().includes('ADMIN')
);

/**
 * Kiểm tra trạng thái đăng nhập dựa trên sự tồn tại của accessToken.
 * Dùng hàm này thay vì gán const để tránh stale closure.
 */
export const getIsLoggedIn = () => !!localStorage.getItem('accessToken');

// BE đặt UUID người dùng trong JWT ID standard claim (jti).
// Profile API dùng UUID này cho PATCH /api/v1/users/{id}.
export const getCurrentUserId = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payload = decodeJwtPayload(token);
    return typeof payload?.jti === 'string' && payload.jti ? payload.jti : null;
  } catch {
    return null;
  }
};

export const isStaff = () => {
  return getRoles().some(role => {
    if (typeof role !== 'string') return false;
    const normalized = role.toUpperCase();
    return normalized.includes('STAFF') || normalized.includes('EMPLOYEE');
  });
};

export const isAdminOrStaff = () => isAdmin() || isStaff();
