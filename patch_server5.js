const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

code = code.replace(/saveToFirebase\('members', db\.members\);/, "saveToFirebase('members', db.members);\n  saveToFirebase('staff', db.staff);\n  saveToFirebase('time_logs', db.time_logs);");

fs.writeFileSync('server/server.js', code);
