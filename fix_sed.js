const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');
code = code.replace(/if \(canLock[\s\S]*?name \&\& \(selectedTableIds \|\| \[\]\)\.length > 0\) \{/g, 'if (canLock && name && (selectedTableIds || []).length > 0) {');
fs.writeFileSync('server/server.js', code);
