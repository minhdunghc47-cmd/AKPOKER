const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const unassignLogic = `
  socket.on('unassign_dealer', (payload) => {
    const table = db.tables.find(tbl => tbl.id === payload.table_id);
    if (table && table.dealer_name) {
      const oldStaff = db.staff.find(s => s.name === table.dealer_name);
      if (oldStaff) {
          oldStaff.status = 'waiting';
          if (oldStaff.session_start) {
              oldStaff.total_dealing_ms = (oldStaff.total_dealing_ms || 0) + (Date.now() - oldStaff.session_start);
              oldStaff.session_start = null;
          }
      }
      table.dealer_name = null;
      table.dealer_time = null;
      
      const t = db.tournaments.find(t => t.id === payload.tour_id);
      if (t) {
        // Check if any other table has a dealer
        const hasDealer = db.tables.some(tbl => t.tables.includes(tbl.id) && tbl.dealer_name);
        t.dealer_assigned = hasDealer;
      }
      
      broadcastState();
      io.emit('staff_data_updated', db.staff);
    }
  });
`;

code = code.replace(
    /socket\.on\('assign_dealer', \(payload\) => {/,
    unassignLogic + "\n  socket.on('assign_dealer', (payload) => {"
);

fs.writeFileSync('server/server.js', code);
console.log('Patched server for unassign_dealer');
