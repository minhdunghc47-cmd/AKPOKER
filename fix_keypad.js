const fs = require('fs');
let code = fs.readFileSync('client/hr_kiosk.html', 'utf8');

code = code.replace(
    /<div class="grid grid-cols-3 gap-2 mb-6">/g,
    '<div class="grid grid-cols-3 gap-2 mb-6" style="grid-template-columns: repeat(3, minmax(0, 1fr)) !important;">'
);

fs.writeFileSync('client/hr_kiosk.html', code);
console.log('Fixed keypad layout');
