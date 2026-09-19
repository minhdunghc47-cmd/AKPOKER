const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

code = code.replace(
    /\} else \{\n  \/\/ Generate 20 test accounts if no DB/,
    "} else {\n  isFirebaseLoaded = true;\n  // Generate 20 test accounts if no DB"
);
fs.writeFileSync('server/server.js', code);
