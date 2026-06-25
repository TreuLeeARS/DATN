import { products } from './src/data/products.js';
import axios from 'axios';

async function testFilter() {
  try {
    const res = await axios.get('http://localhost:8081/api/v1/categorys/root');
    const rootCates = res.data.data;
    const fullCates = await Promise.all(
      rootCates.map(async (cat) => {
        const subResponse = await axios.get(`http://localhost:8081/api/v1/categorys/${cat.id}`);
        const subs = subResponse.data.data || [];
        return {
          ...cat,
          subcategories: subs.map(sub => ({
            ...sub,
            parentCategory: cat
          }))
        };
      })
    );

    // Let's find "Áo sơ mi"
    let selectedCategory = null;
    for (const root of fullCates) {
      const sub = root.subcategories?.find(s => s.name.toLowerCase() === 'áo sơ mi'.toLowerCase());
      if (sub) {
        selectedCategory = sub;
        break;
      }
    }

    console.log('Selected Category Object:', JSON.stringify(selectedCategory, null, 2));

    if (!selectedCategory) {
      console.log('Could not find subcategory "Áo sơ mi" in DB');
      return;
    }

    const targetCategoryStr = selectedCategory.name.replace(/\+/g, ' ').toLowerCase().normalize('NFC');
    console.log('targetCategoryStr:', targetCategoryStr, 'codes:', printCodes(targetCategoryStr));

    const filtered = products.filter(p => {
      const productCategoryLower = p.category.toLowerCase().normalize('NFC');
      const productNameLower = p.name.toLowerCase().normalize('NFC');
      
      const isDirectMatch = (
        productCategoryLower === targetCategoryStr ||
        (targetCategoryStr === 'áo' && productCategoryLower === 'tops') ||
        (targetCategoryStr === 'quần' && productCategoryLower === 'bottoms') ||
        (targetCategoryStr === 'váy & đầm' && productCategoryLower === 'dresses') ||
        (targetCategoryStr === 'set đồ' && productCategoryLower === 'sets') ||
        (targetCategoryStr === 'áo khoác' && productCategoryLower === 'outerwear') ||
        (targetCategoryStr === 'giày' && productCategoryLower === 'shoes') ||
        (targetCategoryStr === 'túi xách' && productCategoryLower === 'bags') ||
        (targetCategoryStr === 'phụ kiện' && productCategoryLower === 'accessories')
      );
      
      if (isDirectMatch) return true;
      
      let parentNameLower = null;
      if (typeof selectedCategory === 'object' && selectedCategory.parentCategory) {
        parentNameLower = selectedCategory.parentCategory.name.toLowerCase().normalize('NFC');
      }

      console.log(`Product: "${p.name}" (${p.category})`);
      console.log(`  parentNameLower: "${parentNameLower}" codes:`, printCodes(parentNameLower));
      console.log(`  productCategoryLower: "${productCategoryLower}"`);

      if (parentNameLower) {
        const isFromParent = (
          (parentNameLower === 'áo' && productCategoryLower === 'tops') ||
          (parentNameLower === 'quần' && productCategoryLower === 'bottoms') ||
          (parentNameLower === 'váy & đầm' && productCategoryLower === 'dresses') ||
          (parentNameLower === 'set đồ' && productCategoryLower === 'sets') ||
          (parentNameLower === 'áo khoác' && productCategoryLower === 'outerwear') ||
          (parentNameLower === 'giày' && productCategoryLower === 'shoes') ||
          (parentNameLower === 'túi xách' && productCategoryLower === 'bags') ||
          (parentNameLower === 'phụ kiện' && productCategoryLower === 'accessories')
        );
        
        console.log(`  isFromParent: ${isFromParent}`);

        if (isFromParent) {
          let keyword = targetCategoryStr;
          if (keyword.startsWith('áo ')) keyword = keyword.substring(3);
          
          console.log(`  keyword: "${keyword}" codes:`, printCodes(keyword));
          const match = productNameLower.includes(keyword) || p.tags.some(t => t.toLowerCase().normalize('NFC').includes(keyword));
          console.log(`  match: ${match}`);
          return match;
        }
      }
      return false;
    });

    console.log(`Total filtered products: ${filtered.length}`);
  } catch (err) {
    console.error(err);
  }
}

function printCodes(str) {
  if (!str) return 'null';
  const codes = [];
  for (let i = 0; i < str.length; i++) {
    codes.push(str.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'));
  }
  return codes.join(' ');
}

testFilter();
