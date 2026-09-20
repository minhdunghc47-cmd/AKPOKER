const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

// Replace sell_ticket auto-seating logic
const oldLogic = /\/\/ Áp dụng Balance Seating & Seat Finder[\s\S]*?const occupiedSeats = playersAtTable\.map\(p => p\.seat\);[\s\S]*?for \(let i = 1; i <= 9; i\+\+\) \{[\s\S]*?if \(!occupiedSeats\.includes\(i\)\) \{[\s\S]*?assigned_seat = i;[\s\S]*?break;[\s\S]*?\}[\s\S]*?\}/;

const newLogic = `// Áp dụng Balance Seating & Seat Finder: Tìm bàn ít người nhất
    let assigned_table = null;
    let assigned_seat = null;
    let minPlayers = 999;
    
    for (let tableId of t.tables) {
        const aliveCount = t.players.filter(p => p.table_id === tableId && p.status === 'alive').length;
        if (aliveCount < minPlayers) {
            minPlayers = aliveCount;
        }
    }
    
    if (minPlayers >= 9) {
        if (callback) callback({ success: false, message: "Hệ thống báo: TẤT CẢ CÁC BÀN ĐÃ ĐẦY (9/9)! Hãy yêu cầu Floor mở thêm bàn mới trước khi Thu ngân có thể bán vé!"});
        return;
    }
    
    for (let tableId of t.tables) {
        const alivePlayers = t.players.filter(p => p.table_id === tableId && p.status === 'alive');
        if (alivePlayers.length === minPlayers) {
            assigned_table = tableId;
            const occupiedSeats = alivePlayers.map(p => p.seat);
            for (let i = 1; i <= 9; i++) {
                if (!occupiedSeats.includes(i)) {
                    assigned_seat = i;
                    break;
                }
            }
            break;
        }
    }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('server/server.js', code);
console.log('Patched server sell_ticket');
