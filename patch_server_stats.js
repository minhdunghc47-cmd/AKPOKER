const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const newEvents = `
  socket.on('adjust_time', (tourId, seconds) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && (t.status === 'running' || t.status === 'paused')) {
        t.time_remaining += seconds;
        if(t.time_remaining < 0) t.time_remaining = 0;
        broadcastState();
    }
  });

  socket.on('force_edit_stats', (payload) => {
    const { tour_id, entries, alive } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    if (t) {
        t.entries = entries;
        const currentAlivePlayers = t.players.filter(p => p.status === 'alive');
        const diff = alive - currentAlivePlayers.length;
        
        if (diff > 0) {
            // Need to add dummy alive players
            for(let i = 0; i < diff; i++) {
                const dummyTable = t.tables[0] || null;
                t.players.push({
                    phone: 'DUMMY_' + Date.now() + '_' + i,
                    name: 'Manual Edit',
                    status: 'alive',
                    table_id: dummyTable,
                    seat: 99 // dummy
                });
            }
        } else if (diff < 0) {
            // Need to bust out some alive players
            let toRemove = Math.abs(diff);
            for (let p of t.players) {
                if (p.status === 'alive') {
                    p.status = 'busted';
                    toRemove--;
                    if (toRemove === 0) break;
                }
            }
        }
        
        // Recalculate net_fund if needed? Wait, buy-in amounts might be off.
        // Let's just adjust total_paid based on entries
        // Actually, just let the manual force_edit fix the entries number for display.
        
        broadcastState();
    }
  });
`;

code = code.replace(/socket\.on\('end_tour'/, newEvents + '\n  socket.on(\'end_tour\'');

fs.writeFileSync('server/server.js', code);
console.log('Patched server stats events');
