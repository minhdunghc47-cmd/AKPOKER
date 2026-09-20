const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

const oldHonor = `                    if (bustedName) {
                        // Đã có người nhận giải -> Làm mờ
                        row.className = 'flex justify-between items-center bg-[#111] p-4 rounded border border-[#333] opacity-60';
                        let rankHtml = \`<div class="font-mafia text-2xl text-gray-600 w-16 text-center bg-black rounded p-1">#\${p.rank}</div>\`;
                        if(p.rank === 1) rankHtml = \`<div class="font-mafia text-3xl text-gray-500 w-16 text-center bg-black rounded p-1"><i class="fa-solid fa-trophy text-xl mb-1 block"></i>1</div>\`;
                        
                        row.innerHTML = \`
                            \${rankHtml}
                            <div class="flex-1 text-center font-bold text-gray-400 text-lg uppercase tracking-widest line-through truncate px-4">\${bustedName}</div>
                            <div class="font-teko text-4xl text-gray-500 font-bold line-through">\${formatMoney(p.amount)} <span class="text-xl">₫</span></div>
                        \`;
                    }`;

const newHonor = `                    if (bustedName) {
                        // Đã có người nhận giải -> Vinh danh rực rỡ
                        row.className = 'flex justify-between items-center bg-gradient-to-r from-[#d4af37]/20 to-[#111] p-4 rounded border border-[#d4af37]/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]';
                        let rankHtml = \`<div class="font-mafia text-2xl text-white w-16 text-center shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] bg-black rounded p-1">#\${p.rank}</div>\`;
                        let amountHtml = \`<div class="font-teko text-4xl text-emerald-400 font-bold">\${formatMoney(p.amount)} <span class="text-xl">₫</span></div>\`;
                        
                        if(p.rank === 1) {
                            row.className = 'flex justify-between items-center bg-gradient-to-r from-yellow-500/30 to-[#111] p-5 rounded border border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)] transform scale-105 my-2';
                            rankHtml = \`<div class="font-mafia text-3xl text-yellow-400 w-16 text-center shadow-[inset_0_0_15px_rgba(212,175,55,0.4)] bg-black/50 rounded p-1"><i class="fa-solid fa-trophy text-xl mb-1 block"></i>1</div>\`;
                            amountHtml = \`<div class="font-teko text-[3.5rem] text-[#d4af37] font-bold drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]">\${formatMoney(p.amount)} <span class="text-2xl">₫</span></div>\`;
                        }
                        
                        row.innerHTML = \`
                            \${rankHtml}
                            <div class="flex-1 text-center font-bold text-white text-[1.3rem] uppercase tracking-widest truncate px-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">\${bustedName}</div>
                            \${amountHtml}
                        \`;
                    }`;

code = code.replace(oldHonor, newHonor);
fs.writeFileSync('client/main_tv.html', code);
console.log('Patched main_tv.html to honor players');
