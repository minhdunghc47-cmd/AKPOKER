const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

code = code.replace(/const socket = io\(\);/, "const socket = io('https://akpoker.onrender.com');");

fs.writeFileSync('client/main_tv.html', code);
console.log('Fixed socket URL');
