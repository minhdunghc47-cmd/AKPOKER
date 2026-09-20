const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

const oldPayoutBlock = /if \(payoutsToRender\.length > 0\) \{[\s\S]*?payoutListEl\.appendChild\(row\);\s*\}\);/m;

const newPayoutBlock = `if (payoutsToRender.length > 0) {
                payoutsToRender.forEach(p => {
                    const bustedName = tour.itm_results ? tour.itm_results[p.rank] : null;
                    const row = document.createElement('div');
                    
                    const isTop1 = p.rank === 1;
                    
                    // Base styles
                    const containerStyle = isTop1 
                        ? 'flex items-center justify-between w-full gap-4 px-4 py-4 bg-gradient-to-r from-yellow-500/30 to-[#111] border border-yellow-500 rounded shadow-[0_0_30px_rgba(234,179,8,0.4)] my-2'
                        : (bustedName 
                            ? 'flex items-center justify-between w-full gap-4 px-4 py-3 bg-gradient-to-r from-[#d4af37]/20 to-[#111] border border-[#d4af37]/50 rounded shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                            : 'flex items-center justify-between w-full gap-4 px-4 py-3 bg-[#111] border border-[#333] rounded shadow-[0_0_15px_rgba(16,185,129,0.1)]');
                    
                    const rankStyle = isTop1
                        ? 'w-20 shrink-0 flex justify-center items-center font-mafia text-3xl text-yellow-400 bg-black/50 rounded p-1 shadow-[inset_0_0_15px_rgba(212,175,55,0.4)]'
                        : 'w-16 shrink-0 flex justify-center items-center font-mafia text-2xl text-white bg-black rounded p-1 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]';
                        
                    const rankContent = isTop1 ? '<i class="fa-solid fa-trophy mr-1 text-xl"></i>1' : '#' + p.rank;
                    
                    const nameStyle = isTop1
                        ? 'flex-1 text-left truncate font-bold text-yellow-400 text-3xl uppercase tracking-widest drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]'
                        : 'flex-1 text-left truncate font-bold text-white text-xl uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]';
                        
                    const amountStyle = isTop1
                        ? 'whitespace-nowrap shrink-0 text-right font-teko text-[3.5rem] text-yellow-400 font-bold tracking-tight drop-shadow-[0_0_15px_rgba(212,175,55,0.8)] leading-none'
                        : 'whitespace-nowrap shrink-0 text-right font-teko text-4xl text-emerald-400 font-bold tracking-tight leading-none';
                        
                    const amountSymbolStyle = isTop1 ? 'text-2xl' : 'text-xl';

                    row.className = containerStyle;
                    
                    let nameHtml = '';
                    if (bustedName) {
                        nameHtml = \`<div class="\${nameStyle}">\${bustedName}</div>\`;
                    } else {
                        nameHtml = \`<div class="flex-1 border-b-2 border-dashed border-[#333] opacity-70"></div>\`;
                    }
                    
                    row.innerHTML = \`
                        <div class="\${rankStyle}">\${rankContent}</div>
                        \${nameHtml}
                        <div class="\${amountStyle}">\${formatMoney(p.amount)} <span class="\${amountSymbolStyle}">₫</span></div>
                    \`;
                    
                    payoutListEl.appendChild(row);
                });`;

code = code.replace(oldPayoutBlock, newPayoutBlock);
fs.writeFileSync('client/main_tv.html', code);
console.log('Patched strict flexbox layout for Payouts');
