const fs = require('fs');
let code = fs.readFileSync('client/td_dashboard.html', 'utf8');

// Replace the container
const oldContainerRegex = /<div id="blinds-preview-container" class="hidden flex-col gap-2 flex-1 min-h-\[250px\]">[\s\S]*?<\/div>\s*<\/div>\s*<div>\s*<label class="block text-\[11px\] font-bold text-\[#d4af37\]/m;

const newContainer = `<div id="blinds-preview-container" class="hidden flex-col gap-3 flex-1 mt-4">
            <button class="bg-[#1a1a1a] border border-[#d4af37] text-[#d4af37] py-4 rounded font-bold uppercase hover:bg-[#222] transition text-sm flex items-center justify-center gap-2 shadow-[0_4px_10px_rgba(0,0,0,0.5)]" onclick="openBlindsModal()">
                <i class="fa-solid fa-gear"></i> CẤU HÌNH BLINDS CHI TIẾT
            </button>
            <button class="bg-[#2a1738] border border-[#9d4edd] text-[#e0aaff] py-3 rounded font-bold uppercase hover:bg-[#3c096c] transition text-xs flex items-center justify-center gap-2 shadow-[0_4px_10px_rgba(0,0,0,0.5)]" onclick="saveTemplate()">
                <i class="fa-solid fa-floppy-disk"></i> LƯU LÀM MẪU MỚI
            </button>
        </div>

        <div>
            <label class="block text-[11px] font-bold text-[#d4af37]`;

code = code.replace(oldContainerRegex, newContainer);

const modalHTML = `
    <!-- MODAL CẤU HÌNH BLINDS -->
    <div id="blinds-modal" class="fixed inset-0 bg-black/85 hidden items-center justify-center z-50 backdrop-blur-sm">
        <div class="bg-[#161616] border border-[#d4af37] p-6 rounded-2xl w-[95%] md:w-[80%] max-w-[900px] shadow-[0_0_40px_rgba(212,175,55,0.2)] flex flex-col h-[85vh]">
            <h3 class="text-2xl font-mafia text-gold mb-4 uppercase text-center border-b border-[#333] pb-3 drop-shadow-md">
                <i class="fa-solid fa-sliders mr-2"></i>Cấu Hình Cấu Trúc Blinds
            </h3>
            
            <div class="flex justify-end mb-4">
                <div class="flex items-center gap-3 bg-red-900/40 px-4 py-2 rounded-lg border border-red-500 shadow-md">
                    <span class="text-sm font-bold text-white tracking-widest uppercase">LATE REG KẾT THÚC TẠI LEVEL:</span>
                    <input type="number" id="late-reg-input" class="w-16 bg-transparent text-white font-bold border-b border-red-400 focus:outline-none text-center text-xl" value="8">
                </div>
            </div>

            <div class="bg-[#0a0a0a] border border-[#333] rounded-lg flex-1 overflow-y-auto mb-4">
                <table class="w-full text-left text-sm text-gray-300 table-auto">
                    <thead class="bg-[#1f1f1f] sticky top-0 text-[#d4af37] border-b border-[#333] z-10 shadow-md">
                        <tr>
                            <th class="p-4 font-bold uppercase tracking-wider w-[15%]">Level</th>
                            <th class="p-4 font-bold uppercase tracking-wider text-center w-[40%]">SB / BB</th>
                            <th class="p-4 font-bold uppercase tracking-wider w-[20%]">BBA (Ante)</th>
                            <th class="p-4 font-bold uppercase tracking-wider w-[15%]">Time (Phút)</th>
                            <th class="p-4 font-bold uppercase tracking-wider w-[10%] text-center">Xóa</th>
                        </tr>
                    </thead>
                    <tbody id="blinds-preview-body"></tbody>
                </table>
            </div>

            <div class="flex gap-4 mb-4">
                <button class="flex-1 bg-[#1a1a1a] border border-[#333] text-[#d4af37] py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-[#222] transition shadow-md" onclick="addBlindRow(false)"><i class="fa-solid fa-plus mr-2"></i> Thêm Level</button>
                <button class="flex-1 bg-[#800020]/20 border border-[#800020]/50 text-red-400 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-[#800020]/40 transition shadow-md" onclick="addBlindRow(true)"><i class="fa-solid fa-mug-hot mr-2"></i> Thêm Break</button>
            </div>

            <button class="btn-gold py-4 w-full rounded-lg font-bold uppercase tracking-widest text-lg shadow-lg" onclick="closeBlindsModal()">XONG / LƯU TẠM</button>
        </div>
    </div>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>`;

code = code.replace('<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>', modalHTML);

fs.writeFileSync('client/td_dashboard.html', code);
console.log('Patched HTML');
