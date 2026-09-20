const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

code = code.replace(/  \}\);\n  broadcastState\(\);\n\n  \n    socket\.on\('seed_staff_data'/g, "  });\n  // Removed broadcastState(); to prevent write on connect\n\n  socket.on('seed_staff_data'");

fs.writeFileSync('server/server.js', code);
