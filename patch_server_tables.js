const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const newEvents = `
  socket.on('add_table_to_tour', (payload) => {
    const { tour_id, table_id } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    const tbl = db.tables.find(x => x.id === table_id);
    if (t && tbl && !tbl.is_locked) {
        if (!t.tables.includes(table_id)) {
            t.tables.push(table_id);
            tbl.is_locked = true;
            broadcastState();
        }
    }
  });

  socket.on('remove_table_from_tour', (payload) => {
    const { tour_id, table_id } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    const tbl = db.tables.find(x => x.id === table_id);
    if (t && tbl) {
        // Kiểm tra xem bàn có người đang alive không
        const alivePlayers = (t.players||[]).filter(p => p.table_id === table_id && p.status === 'alive');
        if (alivePlayers.length > 0) return; // Không cho đóng

        t.tables = t.tables.filter(id => id !== table_id);
        tbl.is_locked = false;
        
        // Trả dealer về waiting
        if (tbl.dealer_name) {
            const staff = db.staff.find(s => s.name === tbl.dealer_name);
            if (staff && staff.status === 'busy') staff.status = 'waiting';
            tbl.dealer_name = null;
            tbl.dealer_time = null;
        }
        
        broadcastState();
        io.emit('staff_data_updated', db.staff);
    }
  });
`;

code = code.replace(/socket\.on\('assign_dealer',/, newEvents + '\n  socket.on(\'assign_dealer\',');

fs.writeFileSync('server/server.js', code);
console.log('Patched server table events');
