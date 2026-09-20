const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const oldBustOut = `  socket.on('bust_out', (payload) => {
    const t = db.tournaments.find(t => t.id === payload.tour_id);
    if (t) {
      const p = t.players.find(p => (p.phone === payload.player_phone || p.name === payload.player_name) && p.status === 'alive');
      if (p) { p.status = 'busted'; broadcastState(); }
    }
  });`;

const newBustOut = `  socket.on('bust_out', (payload) => {
    const t = db.tournaments.find(t => t.id === payload.tour_id);
    if (t) {
      const p = t.players.find(p => (p.phone === payload.player_phone || p.name === payload.player_name) && p.status === 'alive');
      if (p) { 
        const aliveCount = t.players.filter(x => x.status === 'alive').length;
        p.rank = aliveCount; // Hạng của player chính là số người còn sống tại thời điểm bị bust
        p.status = 'busted'; 
        
        // Nếu chỉ còn 1 người sống sót duy nhất, tự động gán hạng 1 cho người đó (Winner)
        if (aliveCount - 1 === 1) {
            const winner = t.players.find(x => x.status === 'alive');
            if (winner) winner.rank = 1;
        }
        
        broadcastState(); 
      }
    }
  });`;

code = code.replace(oldBustOut, newBustOut);
fs.writeFileSync('server/server.js', code);
console.log('Patched bust_out');
