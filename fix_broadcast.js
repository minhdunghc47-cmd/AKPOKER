const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

code = code.replace(
  /function broadcastState\(\) \{/,
  "function broadcastState() {\n  if (!isFirebaseLoaded) return;"
);

fs.writeFileSync('server/server.js', code);
