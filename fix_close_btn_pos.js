const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

const regex = /<div class="absolute bottom-5 left-1\/2 -translate-x-1\/2 z-10">[\s\S]*?<\/button>\s*<\/div>\s*<div class="absolute top-7">\$\{dealerHtml\}<\/div>\s*<div class="text-white\/10 font-mafia text-5xl tracking-widest uppercase mt-4 pointer-events-none">ACE<\/div>/;

const replacement = `<div class="absolute top-7">\${dealerHtml}</div>
                        <div class="text-white/10 font-mafia text-5xl tracking-widest uppercase mt-2 pointer-events-none">ACE</div>
                        <button class="mt-3 bg-red-900/40 border border-red-500 text-red-400 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-red-900/80 transition shadow-[0_0_10px_rgba(220,38,38,0.3)] z-10 relative" onclick="closeTableFromTour(\${tbl.id})">
                            <i class="fa-solid fa-minus mr-1"></i>ĐÓNG BÀN
                        </button>`;

code = code.replace(regex, replacement);
fs.writeFileSync('client/floor_ipad.html', code);
console.log('Fixed close btn pos');
