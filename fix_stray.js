const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

code = code.replace(/<\/div>\s*<div class="text-gray-500">CLOCK: <span class="text-white font-digital" id="tbl-clock">—<\/span><\/div>\s*<div class="text-gray-500">PLAYERS: <span class="text-emerald-400" id="tbl-players">—<\/span><\/div>\s*<div class="text-gray-500">BLINDS: <span class="text-emerald-400" id="tbl-blinds">—<\/span><\/div>\s*<\/div>/, '</div>');

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Fixed stray');
