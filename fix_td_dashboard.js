const fs = require('fs');
let code = fs.readFileSync('client/td_dashboard.html', 'utf8');

const regex = /if \(isFinished\) \{[\s\S]*?card\.innerHTML = html;/;

const newCode = `if (isFinished) {
                    html += \`
                        <div class="text-center text-[#800020] text-4xl font-mafia font-bold my-8 tracking-widest" style="text-shadow: 0 0 15px rgba(128,0,32,0.8);">FINISHED</div>
                        <div class="text-center font-bold text-gold mb-8 border border-[#d4af37]/30 bg-[#d4af37]/10 py-4 rounded text-xl">Payout: \${formatMoney(tour.fund.payout_pool || 0)} ₫</div>
                        <button class="mt-auto w-full py-4 bg-[#222] text-gray-400 font-bold rounded border border-[#444] hover:bg-[#333] uppercase tracking-widest text-xs transition" onclick="if(confirm('Xác nhận RESET & NHẢ BÀN?')) socket.emit('reset_tour', '\${tour.id}')">🔄 Reset & Nhả Bàn</button>
                    \`;
                } else {
                    const blind = tour.blinds_structure[tour.current_level_idx];
                    const isBreak = blind.is_break;
                    const blindText = isBreak ? \`<span class="text-[#ff4c4c] animate-pulse"><i class="fa-solid fa-mug-hot"></i> BREAK TIME</span>\` : \`Level \${blind.level}: \${formatMoney(blind.sb).replace('₫','')} / \${formatMoney(blind.bb).replace('₫','')} BBA \${formatMoney(blind.ante).replace('₫','')}\`;
                    
                    const alivePlayers = tour.players.filter(p => p.status === 'alive').length;
                    const totalChips = tour.entries * tour.starting_stack;
                    const avgStack = alivePlayers > 0 ? Math.floor(totalChips / alivePlayers) : 0;

                    let controlButtons = '';
                    if (isRunning) {
                        controlButtons = \`
                            <div class="flex justify-between items-center gap-3 mt-4">
                                <button class="bg-[#222] text-[#d4af37] border border-[#333] px-4 py-3 rounded hover:bg-[#333] transition" onclick="socket.emit('prev_level', '\${tour.id}')"><i class="fa-solid fa-backward"></i></button>
                                <button class="flex-1 py-3 bg-[#800020] text-[#d4af37] border-2 border-[#d4af37] rounded uppercase font-bold text-sm tracking-widest transition-all glow-btn" onclick="socket.emit('pause_tour', '\${tour.id}')">
                                    <i class="fa-solid fa-pause mr-2"></i> PAUSE
                                </button>
                                <button class="bg-[#222] text-[#d4af37] border border-[#333] px-4 py-3 rounded hover:bg-[#333] transition" onclick="socket.emit('next_level', '\${tour.id}')"><i class="fa-solid fa-forward"></i></button>
                            </div>
                        \`;
                    } else if (canPlay) {
                        controlButtons = \`
                            <button class="mt-4 w-full py-3 btn-gold rounded uppercase font-bold text-sm tracking-widest transition-all" onclick="socket.emit('start_tour', '\${tour.id}')">
                                <i class="fa-solid fa-play mr-2"></i> KÍCH HOẠT ĐỒNG HỒ
                            </button>
                        \`;
                    } else {
                        controlButtons = \`
                            <button class="mt-4 w-full py-3 bg-[#222] text-gray-600 border border-[#333] rounded uppercase font-bold text-sm tracking-widest cursor-not-allowed" disabled>
                                ĐANG KHÓA (CHỜ \${tour.entries<6 ? 'KHÁCH' : 'DEALER'})
                            </button>
                        \`;
                    }

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
                }
                card.innerHTML = html;`;

code = code.replace(regex, newCode);
fs.writeFileSync('client/td_dashboard.html', code);
console.log('Fixed td_dashboard body missing');
