const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

code = code.replace(
  /socket\.emit\('staff_data_updated', db\.staff\);/,
  "socket.emit('staff_data_updated', db.staff);\n      socket.emit('update_god_mode', { financial: db.financial || { net_cash: 0, total_debt: 0, total_rake: 0 }, staff: db.staff, all_tours: db.tournaments });"
);

fs.writeFileSync('server/server.js', code);
