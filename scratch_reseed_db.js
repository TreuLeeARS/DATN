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

    // 3. Seed new tree
    console.log('\n--- Seeding New 3-Level Categories Tree ---');

    // Level 1: Root - Quần áo
    const rootQuanAo = await createCate('Quần áo', 'Quần áo thời trang nữ');
    
    // Level 2 under Quần áo
    const catAo = await createCate('Áo', 'Tops', rootQuanAo.id);
    const catQuan = await createCate('Quần', 'Pants/Bottoms/Skirts', rootQuanAo.id);
    const catVayDam = await createCate('Váy & Đầm', 'Dresses', rootQuanAo.id);
    const catSetDo = await createCate('Set đồ', 'Sets', rootQuanAo.id);
    const catAoKhoac = await createCate('Áo khoác', 'Outerwear', rootQuanAo.id);

    // Level 3 under Áo
    await createCate('Áo thun', 'Áo thun năng động', catAo.id);
    await createCate('Áo sơ mi', 'Áo sơ mi thanh lịch', catAo.id);
    await createCate('Áo kiểu', 'Áo kiểu thiết kế', catAo.id);
    await createCate('Áo hai dây & Ba lỗ', 'Áo hai dây ba lỗ mát mẻ', catAo.id);

    // Level 3 under Quần
    await createCate('Quần dài', 'Quần dài lịch sự', catQuan.id);
    await createCate('Quần short', 'Quần short năng động', catQuan.id);
    await createCate('Chân váy', 'Chân váy nữ tính', catQuan.id);
    await createCate('Quần jeans', 'Quần bò denim cá tính', catQuan.id);

    // Level 3 under Váy & Đầm
    await createCate('Đầm dáng suông', 'Đầm dáng suông rộng rãi', catVayDam.id);
    await createCate('Đầm ôm body', 'Đầm body tôn dáng', catVayDam.id);
    await createCate('Đầm dự tiệc', 'Đầm dự tiệc sang trọng', catVayDam.id);
    await createCate('Đầm maxi', 'Đầm maxi thướt tha', catVayDam.id);

    // Level 3 under Set đồ
    await createCate('Set công sở', 'Set đồ công sở lịch sự', catSetDo.id);
    await createCate('Set dạo phố', 'Set đồ dạo phố thoải mái', catSetDo.id);
    await createCate('Set thể thao', 'Set thể thao khỏe khoắn', catSetDo.id);

    // Level 3 under Áo khoác
    await createCate('Blazer', 'Áo khoác blazer cá tính', catAoKhoac.id);
    await createCate('Trench Coat', 'Áo măng tô dáng dài', catAoKhoac.id);
    await createCate('Áo khoác len (Cardigan)', 'Áo khoác cardigan nhẹ nhàng', catAoKhoac.id);
    await createCate('Áo khoác gió', 'Áo gió cản gió bụi', catAoKhoac.id);


    // Level 1: Root - Giày & Túi
    const rootGiayTui = await createCate('Giày & Túi', 'Giày và túi xách thời trang');

    // Level 2 under Giày & Túi
    const catGiay = await createCate('Giày', 'Shoes', rootGiayTui.id);
    const catTuiXach = await createCate('Túi xách', 'Bags', rootGiayTui.id);

    // Level 3 under Giày
    await createCate('Giày cao gót', 'Giày cao gót tôn dáng', catGiay.id);
    await createCate('Giày búp bê', 'Giày búp bê nhẹ nhàng', catGiay.id);
    await createCate('Giày sandals', 'Giày sandals tiện lợi', catGiay.id);
    await createCate('Giày sneakers', 'Giày thể thao sneakers', catGiay.id);

    // Level 3 under Túi xách
    await createCate('Túi đeo chéo', 'Túi đeo chéo trẻ trung', catTuiXach.id);
    await createCate('Túi xách tay', 'Túi xách tay quý phái', catTuiXach.id);
    await createCate('Balo mini', 'Balo kích thước nhỏ tiện lợi', catTuiXach.id);


    // Level 1: Root - Phụ kiện
    const rootPhuKien = await createCate('Phụ kiện', 'Accessories');

    // Level 2 under Phụ kiện
    await createCate('Trang sức', 'Trang sức lấp lánh', rootPhuKien.id);
    await createCate('Kính mắt', 'Kính mắt thời trang', rootPhuKien.id);
    await createCate('Thắt lưng', 'Thắt lưng da cao cấp', rootPhuKien.id);
    await createCate('Mũ & Nón', 'Mũ nón che nắng thời trang', rootPhuKien.id);

    console.log('\nSeed successful!');

  } catch (err) {
    console.error('Error during seeding categories:', err.response?.data || err.message);
  }
}

async function createCate(name, description, parentId = null) {
  const payload = { name, description };
  if (parentId !== null) {
    payload.parent = parentId;
  }
  const res = await api.post('/categorys', payload);
  const created = res.data?.data;
  console.log(`+ Created: "${created.name}" (ID: ${created.id}, Parent ID: ${created.parent || 'None'})`);
  return created;
}

run();
