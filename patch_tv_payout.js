const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

const oldPayout = `            if (payoutsToRender.length > 0) {
                payoutsToRender.forEach(p => {
                    const row = document.createElement('div');
                    row.className = 'flex justify-between items-center bg-[#111] p-4 rounded border border-[#333]';
                    row.innerHTML = \`
                        <div class="font-mafia text-2xl text-gray-400 w-16 text-center shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] bg-black rounded p-1">#\${p.rank}</div>
                        <div class="font-teko text-4xl text-emerald-400 font-bold">\${formatMoney(p.amount)} <span class="text-xl">₫</span></div>
                    \`;
                    if(p.rank === 1) row.innerHTML = \`
                        <div class="font-mafia text-3xl text-yellow-400 w-16 text-center shadow-[inset_0_0_15px_rgba(212,175,55,0.4)] bg-black/50 rounded p-1"><i class="fa-solid fa-trophy text-xl mb-1 block"></i>1</div>
                        <div class="font-teko text-[3rem] text-[#d4af37] font-bold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">\${formatMoney(p.amount)} <span class="text-2xl">₫</span></div>
                    \`;
                    payoutListEl.appendChild(row);
                });`;

const newPayout = `            if (payoutsToRender.length > 0) {
                payoutsToRender.forEach(p => {
                    const bustedName = tour.itm_results ? tour.itm_results[p.rank] : null;
                    const row = document.createElement('div');
                    
                    if (bustedName) {
                        // Đã có người nhận giải -> Làm mờ
                        row.className = 'flex justify-between items-center bg-[#111] p-4 rounded border border-[#333] opacity-60';
                        let rankHtml = \`<div class="font-mafia text-2xl text-gray-600 w-16 text-center bg-black rounded p-1">#\${p.rank}</div>\`;
                        if(p.rank === 1) rankHtml = \`<div class="font-mafia text-3xl text-gray-500 w-16 text-center bg-black rounded p-1"><i class="fa-solid fa-trophy text-xl mb-1 block"></i>1</div>\`;
                        
                        row.innerHTML = \`
                            \${rankHtml}
                            <div class="flex-1 text-center font-bold text-gray-400 text-lg uppercase tracking-widest line-through truncate px-4">\${bustedName}</div>
                            <div class="font-teko text-4xl text-gray-500 font-bold line-through">\${formatMoney(p.amount)} <span class="text-xl">₫</span></div>
                        \`;
                    } else {
                        // Chưa có người nhận -> Rực rỡ
                        row.className = 'flex justify-between items-center bg-[#111] p-4 rounded border border-[#333] shadow-[0_0_15px_rgba(16,185,129,0.1)]';
                        let rankHtml = \`<div class="font-mafia text-2xl text-gray-400 w-16 text-center shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] bg-black rounded p-1">#\${p.rank}</div>\`;
                        let amountHtml = \`<div class="font-teko text-4xl text-emerald-400 font-bold">\${formatMoney(p.amount)} <span class="text-xl">₫</span></div>\`;
                        
                        if(p.rank === 1) {
                            rankHtml = \`<div class="font-mafia text-3xl text-yellow-400 w-16 text-center shadow-[inset_0_0_15px_rgba(212,175,55,0.4)] bg-black/50 rounded p-1"><i class="fa-solid fa-trophy text-xl mb-1 block"></i>1</div>\`;
                            amountHtml = \`<div class="font-teko text-[3rem] text-[#d4af37] font-bold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">\${formatMoney(p.amount)} <span class="text-2xl">₫</span></div>\`;
                        }
                        
                        row.innerHTML = \`
                            \${rankHtml}
                            <div class="flex-1 text-center font-bold text-[#d4af37] text-lg uppercase tracking-widest truncate px-4 opacity-70 border-b border-dashed border-[#333] mx-4 self-end mb-2"></div>
                            \${amountHtml}
                        \`;
                    }
                    
                    payoutListEl.appendChild(row);
                });`;

code = code.replace(oldPayout, newPayout);
fs.writeFileSync('client/main_tv.html', code);
console.log('Patched main_tv.html with itm_results rendering');
