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
      console.error('Failed to get access token:', loginRes.data);
      return;
    }
    console.log('Login successful.');
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 1. Fetch all existing categories to wipe them out
    console.log('Fetching all existing categories...');
    const allRes = await api.get('/categorys?size=1000');
    const categories = allRes.data?.data?.content || [];
    console.log(`Found ${categories.length} existing categories.`);

    // 2. Wipe categories layer-by-layer
    if (categories.length > 0) {
      console.log('Deleting existing categories...');
      let list = [...categories];
      let iterations = 0;
      while (list.length > 0 && iterations < 10) {
        let deletedCount = 0;
        for (let i = list.length - 1; i >= 0; i--) {
          try {
            await api.delete(`/categorys/${list[i].id}`);
            console.log(`- Deleted: "${list[i].name}" (ID: ${list[i].id})`);
            list.splice(i, 1);
            deletedCount++;
          } catch (err) {
            // Fails if this category still has children. It will be deleted in subsequent passes.
          }
        }
        console.log(`Pass finished. Deleted ${deletedCount} categories in this pass. Remaining: ${list.length}`);
        iterations++;
        if (deletedCount === 0) {
          console.warn('Some categories could not be deleted. Remaining:', list.map(c => c.name));
          break;
        }
      }
    }

    // 3. Seed ONLY the 3 root categories
    console.log('\n--- Seeding ONLY 3 Root Categories ---');

    await createCate('Quần áo', 'Quần áo thời trang nữ');
    await createCate('Giày & Túi', 'Giày và túi xách thời trang');
    await createCate('Phụ kiện', 'Phụ kiện thời trang');

    console.log('\nDatabase cleaned to only 3 root categories successfully!');

  } catch (err) {
    console.error('Error during database cleanup:', err.response?.data || err.message);
  }
}

async function createCate(name, description) {
  const payload = { name, description };
  const res = await api.post('/categorys', payload);
  const created = res.data?.data;
  console.log(`+ Created Root: "${created.name}" (ID: ${created.id})`);
  return created;
}

run();
