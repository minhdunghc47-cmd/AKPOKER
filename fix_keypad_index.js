const fs = require('fs');
let code = fs.readFileSync('client/index.html', 'utf8');

code = code.replace(
    /<div class="grid grid-cols-3 gap-3 mb-8">/g,
    '<div class="grid grid-cols-3 gap-3 mb-8" style="grid-template-columns: repeat(3, minmax(0, 1fr)) !important;">'
);

fs.writeFileSync('client/index.html', code);
console.log('Fixed keypad layout in index.html');
