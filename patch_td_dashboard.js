const fs = require('fs');
let code = fs.readFileSync('client/td_dashboard.html', 'utf8');

const newFields = `
            <div>
                <label class="block text-[11px] font-bold text-[#d4af37] mb-2 uppercase tracking-widest">Thời gian bắt đầu dự kiến</label>
                <input type="datetime-local" id="scheduled-start" class="input-mafia text-sm font-bold text-gray-200 mb-4 w-full bg-[#111]">
                <label class="block text-[11px] font-bold text-[#d4af37] mb-2 uppercase tracking-widest">Số người tối thiểu để chia bài</label>
                <input type="number" id="min-players" class="input-mafia text-sm font-bold text-yellow-400 w-full" value="6" min="2" max="10">
            </div>
        </div>
`;
code = code.replace(/<input type="number" id="buy-in-fee" class="input-mafia text-sm font-bold text-emerald-400" value="5000000" step="100000">\n\s*<\/div>\n\s*<\/div>/, `<input type="number" id="buy-in-fee" class="input-mafia text-sm font-bold text-emerald-400" value="5000000" step="100000">\n            </div>` + newFields);

// In socket.emit('create_tour', ...)
const createTourReplacement = `
            const scheduledStart = document.getElementById('scheduled-start').value;
            const minPlayers = document.getElementById('min-players').value;

            socket.emit('create_tour', {
                name,
                selectedTableIds: Array.from(selectedTables),
                settings: { level_time: null, late_reg_level: lateReg, min_players: Number(minPlayers) },
                starting_stack: Number(startStack),
                scheduled_start: scheduledStart ? new Date(scheduledStart).getTime() : null,
                buyin_fee: Number(document.getElementById('buy-in-fee').value),
`;
code = code.replace(/socket\.emit\('create_tour', \{\n\s*name,\n\s*selectedTableIds: Array\.from\(selectedTables\),\n\s*settings: \{ level_time: null, late_reg_level: lateReg \},\n\s*starting_stack: Number\(startStack\),\n\s*buyin_fee: Number\(document\.getElementById\('buy-in-fee'\)\.value\),/, createTourReplacement.trim());

fs.writeFileSync('client/td_dashboard.html', code);
