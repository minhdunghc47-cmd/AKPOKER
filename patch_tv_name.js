const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

code = code.replace(
    /'flex-1 text-left truncate font-bold text-yellow-400 text-3xl uppercase tracking-widest drop-shadow-\[0_0_8px_rgba\(234,179,8,0\.8\)\]'/g,
    "'flex-1 min-w-0 text-left truncate px-4 font-bold text-yellow-400 text-3xl uppercase tracking-widest drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]'"
);

code = code.replace(
    /'flex-1 text-left truncate font-bold text-white text-xl uppercase tracking-widest drop-shadow-\[0_0_8px_rgba\(255,255,255,0\.5\)\]'/g,
    "'flex-1 min-w-0 text-left truncate px-4 font-bold text-white text-xl uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'"
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Added min-w-0 and px-4 to nameStyle');
