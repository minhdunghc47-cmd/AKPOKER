const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const regex = /function broadcastState\(\) \{[\s\S]*?saveToFirebase\('time_logs', db\.time_logs\);/;

const newBroadcast = `function broadcastState(skipSave = false) {
  if (!isFirebaseLoaded) return;
  const activeTours = db.tournaments.filter(t => t.status !== 'archived');
  io.emit('update_tours', activeTours);
  io.emit('update_tables', db.tables);
  io.emit('update_staff_list', db.staff);

  if (!skipSave) {
    saveToFirebase('tournaments', db.tournaments);
    saveToFirebase('members', db.members);
    saveToFirebase('staff', db.staff);
    saveToFirebase('time_logs', db.time_logs);
  }`;

code = code.replace(regex, newBroadcast);

// Now update all load/startup calls to broadcastState(true)
code = code.replace(/isFirebaseLoaded = true;\n      broadcastState\(\);/g, "isFirebaseLoaded = true;\n      broadcastState(true);");
code = code.replace(/io\.on\('connection', \(socket\) => \{\n  broadcastState\(\);/g, "io.on('connection', (socket) => {\n  // Do not broadcast to everyone on connect, just emit to the socket\n  socket.emit('update_god_mode', { financial: db.financial || { net_cash: 0, total_debt: 0, total_rake: 0 }, staff: db.staff, all_tours: db.tournaments });\n  socket.emit('update_tours', db.tournaments.filter(t => t.status !== 'archived'));\n  socket.emit('update_tables', db.tables);\n  socket.emit('update_staff_list', db.staff);\n");

fs.writeFileSync('server/server.js', code);
