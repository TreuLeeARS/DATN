export const isAdmin = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return localStorage.getItem('username') === 'adminbee';
    
    const payload = JSON.parse(atob(parts[1]));
    const roles = payload.roles || payload.authorities || payload.role || [];
    
    const isUserAdmin = Array.isArray(roles)
      ? roles.some(r => typeof r === 'string' && r.toUpperCase().includes('ADMIN'))
      : typeof roles === 'string' && roles.toUpperCase().includes('ADMIN');
      
    return isUserAdmin || localStorage.getItem('username') === 'adminbee';
  } catch (e) {
    return localStorage.getItem('username') === 'adminbee';
  }
};
