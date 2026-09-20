const fs = require('fs');
let code = fs.readFileSync('client/hr_management.html', 'utf8');

code = code.replace(/<a href="\.\/index\.html" class="px-6 py-2 bg-\[#222\].*?"> class=".*?"> class=".*?">/, '<a href="./index.html" class="px-6 py-2 bg-[#222] hover:bg-[#333] text-gray-300 font-bold rounded uppercase text-sm tracking-widest transition-colors">');

fs.writeFileSync('client/hr_management.html', code);
