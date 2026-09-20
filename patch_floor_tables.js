const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

// Replace info bar
const oldInfoBar = /<div class="bg-\[#111\] border-b border-\[#222\] px-5 py-3 flex gap-6 items-center text-xs font-bold uppercase tracking-widest shrink-0">[\s\S]*?<\/div>/;
const newInfoBar = `<div class="bg-[#111] border-b border-[#222] px-5 py-3 flex gap-6 items-center justify-between shrink-0">
            <div class="flex gap-6 items-center text-xs font-bold uppercase tracking-widest flex-wrap">
                <div class="text-gray-500">LEVEL: <span class="text-[#d4af37]" id="tbl-level">—</span></div>
                <div class="text-gray-500">CLOCK: <span class="text-white font-digital" id="tbl-clock">—</span></div>
                <div class="text-gray-500">PLAYERS: <span class="text-emerald-400" id="tbl-players">—</span></div>
                <div class="text-gray-500">BLINDS: <span class="text-emerald-400" id="tbl-blinds">—</span></div>
            </div>
            <button class="bg-blue-900/40 border border-blue-500 text-blue-400 px-3 py-1.5 rounded font-bold uppercase tracking-widest text-xs hover:bg-blue-900/60 transition whitespace-nowrap" onclick="openAddTableToTourModal()">
                <i class="fa-solid fa-plus mr-1"></i>MỞ THÊM BÀN
            </button>
        </div>`;
code = code.replace(oldInfoBar, newInfoBar);

// Add modal for Add table
const addTableModalHtml = `
    <!-- MODAL MỞ THÊM BÀN -->
    <div id="add-table-modal" class="fixed inset-0 bg-black/85 hidden items-center justify-center z-50 backdrop-blur-sm">
        <div class="bg-[#161616] border border-[#d4af37] p-6 rounded-2xl w-[90%] max-w-[400px] shadow-[0_0_40px_rgba(212,175,55,0.2)]">
            <h3 class="text-lg font-mafia text-gold mb-4 text-center uppercase tracking-widest">
                <i class="fa-solid fa-plus-square mr-2"></i>MỞ THÊM BÀN
            </h3>
            <div class="mb-4">
                <label class="block text-[11px] font-bold text-[#d4af37] mb-2 uppercase tracking-widest">CHỌN BÀN RẢNH (IDLE):</label>
                <select id="idle-table-select" class="input-mafia text-sm font-bold w-full">
                </select>
            </div>
            <div class="flex gap-4">
                <button class="flex-1 py-3 bg-[#1a1a1a] border border-[#333] rounded text-[#d4af37] font-bold uppercase text-xs tracking-widest hover:bg-[#222]" onclick="closeAddTableToTourModal()">HỦY</button>
                <button class="flex-1 py-3 btn-gold rounded font-bold uppercase text-xs tracking-widest" onclick="confirmAddTableToTour()">THÊM BÀN</button>
            </div>
        </div>
    </div>
`;
code = code.replace(/<!-- MODAL GÁN DEALER -->/, addTableModalHtml + '\n    <!-- MODAL GÁN DEALER -->');

// Add "Close Table" button to each table
const oldTableHtml = /<div class="absolute top-3 text-gray-500 font-bold tracking-widest text-xs opacity-50">BÀN \$\{tbl\.id\}<\/div>/;
const newTableHtml = `<div class="absolute top-3 w-full px-8 flex justify-between items-start">
                            <div class="text-gray-500 font-bold tracking-widest text-xs opacity-50">BÀN \${tbl.id}</div>
                            <button class="bg-red-900/40 border border-red-500 text-red-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-red-900/80 transition z-10 relative" onclick="closeTableFromTour(\${tbl.id})">
                                <i class="fa-solid fa-minus mr-1"></i>ĐÓNG BÀN
                            </button>
                        </div>`;
code = code.replace(oldTableHtml, newTableHtml);

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
            if(!tableId || !selectedTourId) return;
            socket.emit('add_table_to_tour', { tour_id: selectedTourId, table_id: parseInt(tableId) });
            closeAddTableToTourModal();
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
code = code.replace(/\/\/ =====================\s*\n\s*\/\/ MODALS & ACTIONS/, jsFunctions + '\n        // =====================\n        // MODALS & ACTIONS');

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Patched floor iPad with add/remove table');
