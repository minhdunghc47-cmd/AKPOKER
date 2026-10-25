const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

const jsFunctions = `
        // =====================
        // TABLE MANAGEMENT
        // =====================
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

if (!code.includes('function openAddTableToTourModal')) {
    code = code.replace(/\/\/ =====================\s*\n\s*\/\/ DEALER MODAL/, jsFunctions + '\n        // =====================\n        // DEALER MODAL');
}

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Force injected JS');
