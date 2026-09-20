const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const oldAssign = /socket\.on\('assign_dealer', \(payload\) => \{[\s\S]*?broadcastState\(\);\s*\}\s*\}\);/;

const newAssign = `socket.on('assign_dealer', (payload) => {
    const table = db.tables.find(tbl => tbl.id === payload.table_id);
    if (table) {
      // Free old dealer
      if (table.dealer_name) {
          const oldStaff = db.staff.find(s => s.name === table.dealer_name);
          if (oldStaff) oldStaff.status = 'waiting';
      }
      
      table.dealer_name = payload.dealer_name;
      table.dealer_time = Date.now();
      
      // Mark new dealer as busy
      const newStaff = db.staff.find(s => s.name === payload.dealer_name);
      if (newStaff) newStaff.status = 'busy';
      
      const t = db.tournaments.find(t => t.id === payload.tour_id);
      if (t) t.dealer_assigned = true; 
      
      broadcastState();
      io.emit('staff_data_updated', db.staff); // update floor_ipad dropdowns
    }
  });`;

code = code.replace(oldAssign, newAssign);
fs.writeFileSync('server/server.js', code);
console.log('Fixed assign_dealer');
