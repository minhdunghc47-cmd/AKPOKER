const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const oldMove = /socket\.on\('move_player_table', \(payload\) => \{[\s\S]*?\}\);/;

const newMove = `socket.on('move_player_table', (payload) => {
    const { tour_id, player_phone, new_table_id } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    if (t) {
      const p = t.players.find(p => p.phone === player_phone && p.status === 'alive');
      if (p) {
        p.table_id = parseInt(new_table_id);
        
        // Find empty seat at new table
        let new_seat = 1;
        const playersAtNewTable = t.players.filter(x => x.table_id === p.table_id && x.status === 'alive' && x.phone !== p.phone);
        const occupiedSeats = playersAtNewTable.map(x => x.seat);
        for(let i=1; i<=9; i++){
            if(!occupiedSeats.includes(i)) { new_seat = i; break; }
        }
        p.seat = new_seat;
        
        broadcastState();
      }
    }
  });`;

code = code.replace(oldMove, newMove);
fs.writeFileSync('server/server.js', code);
console.log('Fixed move server');
