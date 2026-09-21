const fs = require('fs');
let code = fs.readFileSync('client/index.html', 'utf8');

code = code.replace(
    /<!-- Virtual Numpad -->\n\s*<div class="grid grid-cols-3 gap-3">/g,
    '<!-- Virtual Numpad -->\n            <div class="grid grid-cols-3 gap-3" style="grid-template-columns: repeat(3, minmax(0, 1fr)) !important;">'
);

fs.writeFileSync('client/index.html', code);
console.log('Fixed keypad layout in index.html (correct string)');
