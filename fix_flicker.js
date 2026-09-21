const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

const fix = `
                let initialDealerTimer = '0m';
                let dealerTimerClass = 'dealer-timer text-[9px] mt-1 bg-black/60 text-gray-400 px-2 py-0.5 rounded-full border border-[#333] tracking-widest';
                if (tbl.dealer_time) {
                    const diffMins = Math.floor((Date.now() - tbl.dealer_time) / 60000);
                    if (diffMins < 60) {
                        initialDealerTimer = diffMins + 'm';
                    } else {
                        const h = Math.floor(diffMins / 60);
                        const m = diffMins % 60;
                        initialDealerTimer = h + 'h' + m.toString().padStart(2, '0') + 'm';
                        dealerTimerClass = 'dealer-timer text-[10px] mt-1 bg-red-900/80 text-red-300 font-bold px-3 py-0.5 rounded-full border border-red-500 animate-pulse tracking-widest';
                    }
                }

                const dealerHtml = tbl.dealer_name
                    ? \`<div class="text-[#d4af37] text-sm font-mafia tracking-widest bg-black/60 px-3 py-1 rounded-full border border-[#d4af37]/30 cursor-pointer hover:bg-black/80 transition shadow-[0_0_10px_rgba(212,175,55,0.2)]" onclick="openDealerModal(\${tbl.id})">
                           <i class="fa-solid fa-hands-holding-circle mr-1"></i>\${tbl.dealer_name}
                       </div>
                       <div class="\${dealerTimerClass}" data-time="\${tbl.dealer_time}">\${initialDealerTimer}</div>\`
`;

code = code.replace(
    /const dealerHtml = tbl\.dealer_name\s*\?\s*`<div class="text-\[#d4af37\][\s\S]*?<\/div>\s*<div class="dealer-timer text-\[9px\] mt-1 bg-black\/60 px-2 rounded-full border" data-time="\$\{tbl\.dealer_time\}">0m<\/div>`/m,
    fix
);

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Fixed dealer timer flicker');
