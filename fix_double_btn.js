const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

code = code.replace(/<div class="absolute bottom-5 left-1\/2 -translate-x-1\/2 z-10">[\s\S]*?<\/button>\s*<\/div>/, '');

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Fixed double btn');
