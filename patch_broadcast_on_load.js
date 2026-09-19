const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

code = code.replace(
    /isFirebaseLoaded = true;\n  \}\);/,
    "isFirebaseLoaded = true;\n    broadcastState();\n  });"
);

fs.writeFileSync('server/server.js', code);
