const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

code = code.replace(/isFirebaseLoaded = true;\n      broadcastState\(\);/g, "isFirebaseLoaded = true;\n      broadcastState(true);");

fs.writeFileSync('server/server.js', code);
