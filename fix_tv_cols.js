const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

code = code.replace(/<div class="w-\[23%\]" bg/g, '<div class="w-[23%] bg');
code = code.replace(/<div class="w-\[45%\]" min/g, '<div class="w-[45%] min');
code = code.replace(/<div class="w-\[32%\]" bg/g, '<div class="w-[32%] bg');

fs.writeFileSync('client/main_tv.html', code);
console.log('Fixed quotes in main_tv');
