const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const regex = /function broadcastState\(skipSave = false\) \{[\s\S]*?\}\n\}/;

const newBroadcast = `function broadcastState(skipSave = false) {
  if (!isFirebaseLoaded) return;
  const activeTours = db.tournaments.filter(t => t.status !== 'archived');
  io.emit('update_tours', activeTours);
  io.emit('update_tables', db.tables);
  io.emit('update_staff_list', db.staff);
  io.emit('update_god_mode', {
    financial: db.financial || { net_cash: 0, total_debt: 0, total_rake: 0 },
    staff: db.staff,
    all_tours: db.tournaments
  });

  if (!skipSave) {
    saveToFirebase('tournaments', db.tournaments);
    saveToFirebase('members', db.members);
    saveToFirebase('staff', db.staff);
    saveToFirebase('time_logs', db.time_logs);
  }
}`;
code = code.replace(regex, newBroadcast);

// Fix the connection event broadcastState call
code = code.replace(/  broadcastState\(\);\n\n  \n  socket\.on\('seed_staff_data'/g, "  // broadcastState is not needed here as client requests data manually\n\n  \n  socket.on('seed_staff_data'");

fs.writeFileSync('server/server.js', code);
