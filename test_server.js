const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');
code = code.replace(/const \{ name, selectedTableIds, settings, starting_stack, buyin_fee \} = data;/, "const { name, selectedTableIds, settings, starting_stack, buyin_fee } = data;\nconsole.log('CREATE_TOUR DATA:', data);");
fs.writeFileSync('server/server.js', code);
