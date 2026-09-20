const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

code = code.replace(/<\/div>\s*<\/div>\s*<div class="absolute top-7">/, '</div>\n                        <div class="absolute top-7">');

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Fixed div');
