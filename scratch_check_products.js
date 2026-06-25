import { products } from './src/data/products.js';
import axios from 'axios';

const extractKeywords = (catName) => {
  const catNameLower = catName.toLowerCase().normalize('NFC');
  let rawKeywords = [catNameLower];
  if (catNameLower.includes('&')) {
    rawKeywords = [...rawKeywords, ...catNameLower.split('&').map(k => k.trim())];
  }
  if (catNameLower.includes('(')) {
    rawKeywords = [...rawKeywords, ...catNameLower.split(/[\(\)]/).map(k => k.trim()).filter(Boolean)];
  }

  const stopWords = ['áo', 'quần', 'váy', 'đầm', 'set', 'giày', 'túi', 'balo', 'khoác'];
  
  const keywords = [];
  rawKeywords.forEach(kw => {
    let words = kw.split(' ');
    while (words.length > 0 && stopWords.includes(words[0])) {
      words.shift();
    }
    const cleanKw = words.join(' ').trim();
    if (cleanKw) {
      keywords.push(cleanKw);
      if (cleanKw.endsWith('s')) {
        keywords.push(cleanKw.substring(0, cleanKw.length - 1));
      }
    }
  });
  
  return [...new Set(keywords)];
};

async function checkProducts() {
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

    console.log('--- NEW PRODUCT COUNTS PER SUBCATEGORY ---');

    for (const root of fullCates) {
      console.log(`Root: "${root.name}"`);
      for (const sub of root.subcategories) {
        const catNameLower = sub.name.toLowerCase();
        
        const matches = products.filter(p => {
          const parentNameLower = root.name.toLowerCase();
          const productCategoryLower = p.category.toLowerCase().normalize('NFC');
          const productNameLower = p.name.toLowerCase().normalize('NFC');

          const isFromParentCategory = (
            (parentNameLower === 'áo' && productCategoryLower === 'tops') ||
            (parentNameLower === 'quần' && productCategoryLower === 'bottoms') ||
            (parentNameLower === 'váy & đầm' && productCategoryLower === 'dresses') ||
            (parentNameLower === 'set đồ' && productCategoryLower === 'sets') ||
            (parentNameLower === 'áo khoác' && productCategoryLower === 'outerwear') ||
            (parentNameLower === 'giày' && productCategoryLower === 'shoes') ||
            (parentNameLower === 'túi xách' && productCategoryLower === 'bags') ||
            (parentNameLower === 'phụ kiện' && productCategoryLower === 'accessories')
          );
          
          if (!isFromParentCategory) return false;

          const keywords = extractKeywords(sub.name);
          return keywords.some(k => productNameLower.includes(k) || p.tags.some(t => t.toLowerCase().normalize('NFC').includes(k)));
        });

        console.log(`  - Sub: "${sub.name}" -> ${matches.length} products`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

checkProducts();
