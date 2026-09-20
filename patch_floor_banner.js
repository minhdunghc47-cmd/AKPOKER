const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

const regex = /const container = document\.getElementById\('tables-container'\);\s*container\.innerHTML = '';/;
const replacement = `const container = document.getElementById('tables-container');
            container.innerHTML = '';
            
            // BALANCE WARNING CHECK
            if (t.tables && t.tables.length > 1) {
                const counts = t.tables.map(tid => (t.players||[]).filter(p => p.table_id === tid && p.status === 'alive').length);
                const max = Math.max(...counts);
                const min = Math.min(...counts);
                if (max - min >= 2) {
                    const warningHtml = \`<div class="mx-6 mt-6 bg-[#800020]/20 border border-[#800020] rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(128,0,32,0.4)] animate-pulse">
                        <div class="flex items-center gap-4">
                            <div class="bg-[#800020] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl"><i class="fa-solid fa-triangle-exclamation"></i></div>
                            <div>
                                <h4 class="text-[#ff4c4c] font-mafia tracking-widest uppercase text-lg">Yêu Cầu Balance Bàn!</h4>
                                <p class="text-red-300 text-xs font-bold uppercase tracking-widest mt-1">Hệ thống phát hiện độ lệch \${max - min} khách giữa các bàn. Vui lòng chuyển khách ngay!</p>
                            </div>
                        </div>
                    </div>\`;
                    container.innerHTML += warningHtml;
                }
            }`;

code = code.replace(regex, replacement);
fs.writeFileSync('client/floor_ipad.html', code);
console.log('Patched floor banner');
