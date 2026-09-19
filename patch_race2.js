const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

code = code.replace(
    /\} else \{\n  console\.log\('\\[LOCAL\\] Chạy với Database RAM giả lập\.'\);/,
    "} else {\n  isFirebaseLoaded = true;\n  console.log('[LOCAL] Chạy với Database RAM giả lập.');"
);
fs.writeFileSync('server/server.js', code);
