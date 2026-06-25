import axios from 'axios';

async function debugDB() {
  try {
    const res = await axios.get('http://localhost:8081/api/v1/categorys/root');
    const roots = res.data.data;
    console.log('Categories details:');
    for (const root of roots) {
      console.log(`- Root: "${root.name}" (len: ${root.name.length})`);
      printCodes(root.name);
      
      const subRes = await axios.get(`http://localhost:8081/api/v1/categorys/${root.id}`);
      const subs = subRes.data.data || [];
      for (const sub of subs) {
        console.log(`  - Sub: "${sub.name}" (len: ${sub.name.length})`);
        printCodes(sub.name);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

function printCodes(str) {
  const codes = [];
  for (let i = 0; i < str.length; i++) {
    codes.push(str.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'));
  }
  console.log(`    Char codes: ${codes.join(' ')}`);
}

debugDB();
