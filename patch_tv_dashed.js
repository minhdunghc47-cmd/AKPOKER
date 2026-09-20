const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

code = code.replace(
    /<div class="flex-1 border-b-2 border-dashed border-\[#333\] opacity-70"><\/div>/g,
    '<div class="flex-1 mx-4 border-b-2 border-dashed border-[#333] opacity-70"></div>'
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Added mx-4 to dashed line');
