const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

code = code.replace(
    /<div class="mt-4 border border-\[#d4af37\]\/50 bg-\[#d4af37\]\/10 text-\[#d4af37\] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm">\s*ĐANG MỞ ĐĂNG KÝ\s*<\/div>/,
    `<div class="mt-4 border border-[#d4af37]/50 bg-[#d4af37]/10 text-[#d4af37] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm">
                    ĐANG MỞ ĐĂNG KÝ
                </div>
                <div class="text-[clamp(1.5rem,2vw,2.5rem)] font-bold text-yellow-400 mt-4 animate-pulse drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]" id="tv-late-reg-countdown"></div>`
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Patched HTML for countdown timer');
