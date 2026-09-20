const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

const regex = /if \(document\.getElementById\('move-modal'\) && !document\.getElementById\('move-modal'\)\.classList\.contains\('hidden'\)\) return true;/;
const replacement = `if (document.getElementById('move-modal') && !document.getElementById('move-modal').classList.contains('hidden')) return true;
            if (document.getElementById('add-table-modal') && !document.getElementById('add-table-modal').classList.contains('hidden')) return true;`;

code = code.replace(regex, replacement);
fs.writeFileSync('client/floor_ipad.html', code);
console.log('Fixed popup check');
