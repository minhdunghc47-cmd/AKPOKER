const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const oldSeatLogic = /const assigned_table = t\.tables\[t\.entries % t\.tables\.length\];\s*const assigned_seat = t\.entries \+ 1;[^\n]*\n\s*t\.players\.push\(\{ phone: member_phone, name: member\.name, status: 'alive', table_id: assigned_table, seat: assigned_seat \}\);/;

const newSeatLogic = `// Áp dụng Balance Seating & Seat Finder
    const assigned_table = t.tables[t.entries % t.tables.length];
    
    // Tìm ghế trống đầu tiên từ 1 đến 9 ở bàn assigned_table
    let assigned_seat = 1;
    const playersAtTable = t.players.filter(p => p.table_id === assigned_table && p.status === 'alive');
    const occupiedSeats = playersAtTable.map(p => p.seat);
    for (let i = 1; i <= 9; i++) {
        if (!occupiedSeats.includes(i)) {
            assigned_seat = i;
            break;
        }
    }
    
    t.players.push({ phone: member_phone, name: member.name, status: 'alive', table_id: assigned_table, seat: assigned_seat });`;

code = code.replace(oldSeatLogic, newSeatLogic);

// Fix bust_out and move_player_table
const oldBustOut = /t\.players = t\.players\.filter\(p => p\.phone !== player_phone\);/;
const newBustOut = `const pIndex = t.players.findIndex(p => p.phone === player_phone);
    if(pIndex !== -1) t.players[pIndex].status = 'bust_out'; // Không xóa khỏi mảng để giữ ghế trống`;
code = code.replace(oldBustOut, newBustOut);

const oldMoveTable = /const p = t\.players\.find\(p => p\.phone === player_phone\);\s*if \(p\) \{\s*p\.table_id = Number\(new_table_id\);\s*\}/;
const newMoveTable = `const p = t.players.find(p => p.phone === player_phone && p.status === 'alive');
    if (p) {
      p.table_id = Number(new_table_id);
      // Tìm ghế mới
      const playersAtNewTable = t.players.filter(x => x.table_id === p.table_id && x.status === 'alive' && x.phone !== p.phone);
      const occupiedSeats = playersAtNewTable.map(x => x.seat);
      let new_seat = 1;
      for(let i=1; i<=9; i++){
          if(!occupiedSeats.includes(i)) { new_seat = i; break; }
      }
      p.seat = new_seat;
    }`;
code = code.replace(oldMoveTable, newMoveTable);

fs.writeFileSync('server/server.js', code);
console.log('Fixed server.js seats');
