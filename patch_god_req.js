const fs = require('fs');
let code = fs.readFileSync('client/god_mode.html', 'utf8');

code = code.replace(
  /const socket = io\('https:\/\/akpoker\.onrender\.com'\);/,
  "const socket = io('https://akpoker.onrender.com');\n\n        socket.on('connect', () => {\n            socket.emit('request_initial_data');\n        });"
);

fs.writeFileSync('client/god_mode.html', code);
