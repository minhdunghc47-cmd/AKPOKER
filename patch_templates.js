const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

code = code.replace(
    /saveToFirebase\('tournaments', db\.tournaments\);/,
    "saveToFirebase('tournaments', db.tournaments);\n    saveToFirebase('tour_templates', db.tour_templates);"
);

fs.writeFileSync('server/server.js', code);
console.log('Patched broadcastState to save tour_templates');
