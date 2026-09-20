const fs = require('fs');
let code = fs.readFileSync('client/td_dashboard.html', 'utf8');

const oldHtmlBlock = /html \+= \`[\s\S]*?<div class="text-center mb-6 bg-\[#050505\] rounded-lg border border-\[#333\] p-4 shadow-inner">[\s\S]*?<\/div>\s*\`;/;

const newHtmlBlock = `
                    const nextBlind = tour.blinds_structure[tour.current_level_idx + 1];
                    let nextBlindText = '—';
                    if (nextBlind) {
                        nextBlindText = nextBlind.is_break ? 'BREAK TIME' : \`Level \${nextBlind.level}: \${formatMoney(nextBlind.sb).replace('₫','')} / \${formatMoney(nextBlind.bb).replace('₫','')} BBA \${formatMoney(nextBlind.ante).replace('₫','')}\`;
                    }

                    const lateRegLvl = tour.settings?.late_reg_level || 8;
                    let lateRegHtml = '';
                    const currentLvlNum = isBreak ? (tour.blinds_structure[tour.current_level_idx - 1]?.level || 0) : blind.level;
                    if (Number(currentLvlNum) <= lateRegLvl) {
                        const remaining = lateRegLvl - Number(currentLvlNum) + 1;
                        lateRegHtml = \`<div class="text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/50 bg-emerald-900/20 px-2 py-1 rounded shadow-md">LATE REG: MỞ (CÒN \${remaining} LVL)</div>\`;
                    } else {
                        lateRegHtml = \`<div class="text-[10px] font-bold uppercase tracking-widest text-red-500 border border-red-500/50 bg-red-900/20 px-2 py-1 rounded shadow-md">LATE REG: ĐÓNG</div>\`;
                    }

                    const estPrize = tour.entries * (tour.buyin_fee || 0);

                    html += \`
                        <div class="text-center mb-6 bg-[#0a0a0a] rounded-2xl border border-[#333] p-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-50"></div>
                            <div class="font-mafia text-2xl text-[#d4af37] font-bold uppercase tracking-widest drop-shadow-md">\${blindText}</div>
                            <div class="text-[11px] text-gray-500 uppercase tracking-widest mt-1 mb-5 font-bold">NEXT: \${nextBlindText}</div>
                            
                            <div class="flex items-center justify-center gap-5 mb-2">
                                <button class="bg-[#1a1a1a] border border-[#444] text-gray-400 w-12 h-12 rounded-full font-bold hover:bg-[#333] hover:text-white transition shadow-md flex items-center justify-center text-sm" onclick="socket.emit('adjust_time', '\${tour.id}', -60)" title="-1 Phút">-1M</button>
                                
                                <div class="font-digital text-7xl font-bold \${isBreak ? 'text-[#ff4c4c]' : 'text-emerald-400'} drop-shadow-[0_0_15px_currentColor] tracking-widest">\${formatTime(tour.time_remaining)}</div>
                                
                                <div class="flex flex-col gap-2">
                                    <button class="bg-[#1a1a1a] border border-[#444] text-gray-400 w-12 h-8 rounded text-[10px] font-bold hover:bg-[#333] hover:text-white transition shadow-md" onclick="socket.emit('adjust_time', '\${tour.id}', 60)">+1M</button>
                                    <button class="bg-[#1a1a1a] border border-[#444] text-gray-400 w-12 h-8 rounded text-[10px] font-bold hover:bg-[#333] hover:text-white transition shadow-md" onclick="socket.emit('adjust_time', '\${tour.id}', 300)">+5M</button>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-between items-center mb-5">
                            \${lateRegHtml}
                            <div class="text-[10px] font-bold uppercase tracking-widest text-blue-400 border border-blue-500/50 bg-blue-900/20 px-2 py-1 rounded shadow-md">PRIZE: \${formatMoney(estPrize).replace('₫','').trim()} VNĐ</div>
                        </div>

                        <div class="flex justify-between text-[11px] uppercase tracking-widest border-t border-[#333] pt-4 mb-3 font-bold text-gray-500">
                            <div>Khách (Alive/Total): <span class="text-white cursor-pointer hover:text-gold transition border-b border-dashed border-white pb-0.5 ml-1" onclick="forceEditStats('\${tour.id}', \${alivePlayers}, \${tour.entries})" title="Sửa thông số thủ công">\${alivePlayers} / \${tour.entries}</span></div>
                            <div>Dealer: <span class="\${dealerOk ? 'text-emerald-500' : 'text-red-500'}">\${dealerOk ? 'Đã gán' : 'Trống'}</span></div>
                        </div>
                        <div class="flex justify-between text-[11px] uppercase tracking-widest border-b border-[#333] pb-4 mb-3 font-bold text-gray-500">
                            <div>Start Stack: <span class="text-[#d4af37]">\${formatMoney(tour.starting_stack).replace('₫','').trim()}</span></div>
                            <div>Avg Stack: <span class="text-blue-400">\${formatMoney(avgStack).replace('₫','').trim()}</span></div>
                        </div>

                        <div class="mt-auto">
                            \${controlButtons}
                            <button class="w-full py-3 mt-4 bg-[#111] text-[#800020] border border-[#800020]/30 hover:bg-[#800020] hover:text-white rounded text-[10px] uppercase tracking-widest font-bold transition shadow-md" onclick="if(confirm('Chốt sổ giải này?')) socket.emit('end_tour', '\${tour.id}')">🛑 CHỐT SỔ (END TOUR)</button>
                        </div>
                    \`;
`;

code = code.replace(oldHtmlBlock, newHtmlBlock);

// Add forceEditStats function
const forceEditJs = `
        function forceEditStats(tourId, currentAlive, currentTotal) {
            const newTotal = prompt(\`Nhập tổng số Entries thực tế (Hiện tại: \${currentTotal}):\`, currentTotal);
            if (newTotal === null) return;
            const newAlive = prompt(\`Nhập số Khách Alive thực tế (Hiện tại: \${currentAlive}):\`, currentAlive);
            if (newAlive === null) return;
            
            const nTotal = parseInt(newTotal);
            const nAlive = parseInt(newAlive);
            
            if (isNaN(nTotal) || isNaN(nAlive) || nAlive > nTotal) {
                alert("Thông số không hợp lệ! Alive không thể lớn hơn Total.");
                return;
            }
            
            if(confirm(\`Xác nhận ghi đè? Alive: \${nAlive}, Total Entries: \${nTotal}\`)) {
                socket.emit('force_edit_stats', { tour_id: tourId, entries: nTotal, alive: nAlive });
            }
        }
`;

code = code.replace(/function renderTables\(\) \{/, forceEditJs + '\n        function renderTables() {');

fs.writeFileSync('client/td_dashboard.html', code);
console.log('Patched td_dashboard html UI');
