const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const oldBustOut = `        const aliveCount = t.players.filter(x => x.status === 'alive').length;
        p.rank = aliveCount; // Hạng của player chính là số người còn sống tại thời điểm bị bust
        p.status = 'busted'; 
        
        // Nếu chỉ còn 1 người sống sót duy nhất, tự động gán hạng 1 cho người đó (Winner)
        if (aliveCount - 1 === 1) {
            const winner = t.players.find(x => x.status === 'alive');
            if (winner) winner.rank = 1;
        }`;

const newBustOut = `        const aliveCount = t.players.filter(x => x.status === 'alive').length;
        p.rank = aliveCount; // Hạng của player chính là số người còn sống tại thời điểm bị bust
        p.status = 'busted'; 
        
        if (!t.itm_results) t.itm_results = {};
        t.itm_results[aliveCount] = p.name || p.phone;
        
        // Nếu chỉ còn 1 người sống sót duy nhất, tự động gán hạng 1 cho người đó (Winner)
        if (aliveCount - 1 === 1) {
            const winner = t.players.find(x => x.status === 'alive');
            if (winner) {
                winner.rank = 1;
                t.itm_results[1] = winner.name || winner.phone;
            }
        }`;

code = code.replace(oldBustOut, newBustOut);
fs.writeFileSync('server/server.js', code);
console.log('Patched bust_out with itm_results');
