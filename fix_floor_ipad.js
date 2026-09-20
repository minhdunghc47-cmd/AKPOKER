const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

// 1. Move ĐÓNG BÀN button
const oldCloseBtn = /<div class="absolute top-3 w-full px-8 flex justify-between items-start">[\s\S]*?<\/div>/;
const newCloseBtn = `<div class="absolute top-3 w-full px-8 flex justify-center items-start pointer-events-none">
                            <div class="text-gray-500 font-bold tracking-widest text-xs opacity-50">BÀN \${tbl.id}</div>
                        </div>
                        <div class="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
                            <button class="bg-red-900/40 border border-red-500 text-red-400 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-red-900/80 transition shadow-[0_0_10px_rgba(220,38,38,0.3)]" onclick="closeTableFromTour(\${tbl.id})">
                                <i class="fa-solid fa-minus mr-1"></i>ĐÓNG BÀN
                            </button>
                        </div>`;
code = code.replace(oldCloseBtn, newCloseBtn);

// 2. Inject JS functions
const jsFunctions = `
        function openAddTableToTourModal() {
            const select = document.getElementById('idle-table-select');
            select.innerHTML = '<option value="">-- Chọn Bàn Trống --</option>';
            const idleTables = globalTables.filter(t => !t.is_locked);
            if(idleTables.length === 0) {
                alert("Hiện không có bàn nào rảnh!");
                return;
            }
            idleTables.forEach(t => {
                select.innerHTML += \`<option value="\${t.id}">Bàn \${t.id}</option>\`;
            });
            document.getElementById('add-table-modal').classList.remove('hidden');
            document.getElementById('add-table-modal').classList.add('flex');
        }
        function closeAddTableToTourModal() {
            document.getElementById('add-table-modal').classList.replace('flex', 'hidden');
        }
        function confirmAddTableToTour() {
            const tableId = document.getElementById('idle-table-select').value;
            if(!tableId || !selectedTourId) {
                alert("Vui lòng chọn bàn rảnh cần mở!");
                return;
            }
            if(confirm(\`Xác nhận MỞ THÊM Bàn \${tableId} vào giải đấu này?\`)) {
                socket.emit('add_table_to_tour', { tour_id: selectedTourId, table_id: parseInt(tableId) });
                closeAddTableToTourModal();
            }
        }
        function closeTableFromTour(tableId) {
            if(!selectedTourId) return;
            // Kiem tra trong HTML neu ban co khach
            const t = currentTours.find(x => x.id === selectedTourId);
            if(!t) return;
            const alive = (t.players||[]).filter(p => p.table_id === tableId && p.status === 'alive');
            if(alive.length > 0) {
                alert(\`Bàn \${tableId} đang có \${alive.length} khách chơi. Vui lòng chuyển hết khách sang bàn khác trước khi đóng!\`);
                return;
            }
            if(confirm(\`Bạn có chắc chắn muốn ĐÓNG Bàn \${tableId} không? (Dealer sẽ được nghỉ)\`)) {
                socket.emit('remove_table_from_tour', { tour_id: selectedTourId, table_id: tableId });
            }
        }
`;

if (!code.includes('openAddTableToTourModal')) {
    code = code.replace(/\/\/ =====================\s*\n\s*\/\/ DEALER MODAL/, jsFunctions + '\n        // =====================\n        // DEALER MODAL');
} else {
    // If it somehow got injected previously but broke, replace it
    code = code.replace(/function openAddTableToTourModal\(\) \{[\s\S]*?function closeTableFromTour\(tableId\) \{[\s\S]*?\}\s*\}/, jsFunctions);
}

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Fixed floor_ipad UI and JS');
