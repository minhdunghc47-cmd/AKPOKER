const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

// 1. Add dealer-timer div
code = code.replace(
    /onclick="openDealerModal\(\$\{tbl\.id\}\)">\n\s*<i class="fa-solid fa-hands-holding-circle mr-1"><\/i>\$\{tbl\.dealer_name\}\n\s*<\/div>/g,
    \`onclick="openDealerModal(\${tbl.id})">
                           <i class="fa-solid fa-hands-holding-circle mr-1"></i>\${tbl.dealer_name}
                       </div>
                       <div class="dealer-timer text-[9px] mt-1 bg-black/60 px-2 rounded-full border" data-time="\${tbl.dealer_time}">0m</div>\`
);

// 2. Add unassign button to modal
code = code.replace(
    /<div class="flex gap-3">\n\s*<button class="flex-1 bg-\[#1a1a1a\] text-gray-400 py-3 rounded-lg font-bold uppercase hover:bg-\[#222\]" onclick="closeDealerModal\(\)">Hủy<\/button>\n\s*<button class="flex-1 btn-gold py-3 rounded-lg font-bold uppercase" onclick="confirmAssignDealer\(\)">Xác Nhận<\/button>\n\s*<\/div>/,
    `<div class="flex gap-2 mb-3">
                <button class="flex-1 bg-red-900/40 text-red-400 border border-red-900 py-2 rounded-lg font-bold uppercase text-xs hover:bg-red-800" onclick="confirmUnassignDealer()">Rút Dealer (Unassign)</button>
            </div>
            <div class="flex gap-3">
                <button class="flex-1 bg-[#1a1a1a] text-gray-400 py-3 rounded-lg font-bold uppercase hover:bg-[#222]" onclick="closeDealerModal()">Hủy</button>
                <button class="flex-1 btn-gold py-3 rounded-lg font-bold uppercase" onclick="confirmAssignDealer()">Xác Nhận</button>
            </div>`
);

// 3. Add unassign JS function
const unassignFunc = `
        function confirmUnassignDealer() {
            if (pendingDealerTableId && selectedTourId) {
                socket.emit('unassign_dealer', { tour_id: selectedTourId, table_id: pendingDealerTableId });
                closeDealerModal();
            }
        }
`;
code = code.replace(
    /function confirmAssignDealer\(\) {/g,
    unassignFunc + "\n        function confirmAssignDealer() {"
);

// 4. Add interval logic
const intervalLogic = `
            const nowMs = Date.now();
            document.querySelectorAll('.dealer-timer').forEach(el => {
                const startTime = parseInt(el.getAttribute('data-time'));
                if (!startTime || isNaN(startTime)) {
                    el.innerText = '0m';
                    return;
                }
                const diffMs = nowMs - startTime;
                const diffMins = Math.floor(diffMs / 60000);
                
                let text = '';
                if (diffMins < 60) {
                    text = diffMins + 'm';
                } else {
                    const h = Math.floor(diffMins / 60);
                    const m = diffMins % 60;
                    text = h + 'h' + m.toString().padStart(2, '0') + 'm';
                }
                el.innerText = text;
                
                if (diffMins >= 60) {
                    el.className = 'dealer-timer text-[10px] mt-1 bg-red-900/80 text-red-300 font-bold px-3 py-0.5 rounded-full border border-red-500 animate-pulse tracking-widest';
                } else {
                    el.className = 'dealer-timer text-[9px] mt-1 bg-black/60 text-gray-400 px-2 py-0.5 rounded-full border border-[#333] tracking-widest';
                }
            });
`;
code = code.replace(
    /document\.getElementById\('header-clock'\)\.innerText = t;/g,
    "document.getElementById('header-clock').innerText = t;\n" + intervalLogic
);

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Patched floor_ipad.html');
