import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

async function run() {
  try {
    console.log('Logging in as Admin...');
    const loginRes = await api.post('/auth/login', {
      username: 'adminbee',
      password: 'Adm!n1'
    });

    const token = loginRes.data?.data?.accessToken;
    if (!token) {
      console.error('Failed to login:', loginRes.data);
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log('Creating root category "Đồ ngủ"...');
    const rootRes = await api.post('/categorys', {
      name: 'Đồ ngủ',
      description: 'Các sản phẩm đồ ngủ mặc nhà thoải mái'
    });
    const rootId = rootRes.data?.data?.id;
    console.log(`Successfully created "Đồ ngủ" with ID: ${rootId}`);

    console.log('Creating subcategory "Pijama" under "Đồ ngủ"...');
    const subRes = await api.post('/categorys', {
      name: 'Pijama',
      description: 'Đồ ngủ Pijama lụa cao cấp',
      parent: rootId
    });
    console.log(`Successfully created "Pijama" with ID: ${subRes.data?.data?.id}`);
    
    console.log('Execution completed successfully!');
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

run();
