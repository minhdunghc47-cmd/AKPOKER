const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

// 1. Dealer warning UI
const oldDealerHtml = /const dealerHtml = tbl\.dealer_name[\s\S]*?<div class="absolute top-7">/;
const newDealerHtml = `const dealerHtml = tbl.dealer_name
                    ? \`<div class="text-[#d4af37] text-sm font-mafia tracking-widest bg-black/60 px-3 py-1 rounded-full border border-[#d4af37]/30 cursor-pointer hover:bg-black/80 transition shadow-[0_0_10px_rgba(212,175,55,0.2)]" onclick="openDealerModal(\${tbl.id})">
                           <i class="fa-solid fa-hands-holding-circle mr-1"></i>\${tbl.dealer_name}
                       </div>\`
                    : \`<button class="text-red-500 font-bold animate-pulse text-[11px] bg-black/60 px-3 py-1 rounded-full border border-red-500/50 cursor-pointer hover:bg-black/80 tracking-widest uppercase" onclick="openDealerModal(\${tbl.id})">
                           ⚠️ THIẾU DEALER
                       </button>\`;
                       
                tableWrapper.innerHTML = \`
                    <div class="absolute inset-x-10 inset-y-6 poker-table-bg flex flex-col items-center justify-center">
                        <div class="absolute top-3 w-full px-8 flex justify-center items-start pointer-events-none">
                            <div class="text-gray-500 font-bold tracking-widest text-xs opacity-50">BÀN \${tbl.id}</div>
                        </div>
                        <div class="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
                            <button class="bg-red-900/40 border border-red-500 text-red-400 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-red-900/80 transition shadow-[0_0_10px_rgba(220,38,38,0.3)]" onclick="closeTableFromTour(\${tbl.id})">
                                <i class="fa-solid fa-minus mr-1"></i>ĐÓNG BÀN
                            </button>
                        </div>
                        <div class="absolute top-7">\${dealerHtml}</div>`;

code = code.replace(/const dealerHtml = tbl\.dealer_name[\s\S]*?<div class="absolute top-7">\$\{dealerHtml\}<\/div>/, newDealerHtml);


// 2. Avatar UI & Buy-in Count
const oldSeatInner = /seatDiv\.innerHTML = \`[\s\S]*?<div class="flex flex-col items-center justify-center w-full h-full p-1">[\s\S]*?<\/div>\s*<div id="menu-\$\{uid\}"/;
const newSeatInner = `
                        const uid = \`seat_\${tbl.id}_\${index}\`;
                        const member = globalMembers.find(m => m.phone === player.phone);
                        const buyinCount = (t.players||[]).filter(x => x.phone === player.phone).length;
                        
                        let seatInner = '';
                        if (member && member.avatar_base64) {
                            seatInner = \`
                                <img src="\${member.avatar_base64}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center; border: 2px solid #d4af37;" />
                                <div class="absolute inset-x-0 bottom-0 bg-black/70 text-center rounded-b-full pb-1 pointer-events-none">
                                    <div class="text-[8px] text-white font-bold truncate px-1">\${(player.name||'').split(' ').pop()}</div>
                                </div>
                            \`;
                        } else {
                            seatInner = \`
                                <div class="flex flex-col items-center justify-center w-full h-full p-1 bg-[#1a1a1a] rounded-full border border-[#d4af37]/30">
                                    <div class="text-[9px] text-[#d4af37] font-bold truncate w-full text-center leading-tight">\${player.phone?.slice(-4) || ''}</div>
                                    <div class="text-[11px] text-white font-bold truncate w-full text-center mt-0.5 leading-tight">\${(player.name||'').split(' ').pop()}</div>
                                    <div class="text-[8px] text-gray-500 font-bold leading-tight">G\${player.seat || pos.id}</div>
                                </div>
                            \`;
                        }

                        seatDiv.onclick = (e) => toggleMenu(e, uid);
                        seatDiv.innerHTML = \`
                            \${seatInner}
                            <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#222] border border-[#d4af37] text-[#d4af37] px-1.5 py-0.5 rounded-full text-[8px] font-bold shadow-md z-20 whitespace-nowrap pointer-events-none">
                                🎟️ Lượt: \${buyinCount}
                            </div>
                            <div id="menu-\${uid}"`;

code = code.replace(/const uid = \`seat_\$\{tbl\.id\}_\$\{index\}\`;\s*seatDiv\.onclick = \(e\) => toggleMenu\(e, uid\);\s*seatDiv\.innerHTML = \`[\s\S]*?<div id="menu-\$\{uid\}"/, newSeatInner);


// 3. Add update_members socket listener
const memberSocket = `
        let globalMembers = [];
        socket.on('update_members', (members) => {
            globalMembers = members;
            if(selectedTourId && !isAnyPopupOpen()) renderTableView();
        });
`;

if (!code.includes("socket.on('update_members'")) {
    code = code.replace(/socket\.on\('update_tours',/, memberSocket + '\n        socket.on(\'update_tours\',');
}

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Patched floor_ipad final');
