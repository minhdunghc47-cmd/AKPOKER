const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

// 1. Reduce Rank column width
code = code.replace(/w-20 shrink-0 flex justify-center items-center font-mafia text-3xl/g, 'w-16 shrink-0 flex justify-center items-center font-mafia text-3xl');
code = code.replace(/w-16 shrink-0 flex justify-center items-center font-mafia text-2xl/g, 'w-14 shrink-0 flex justify-center items-center font-mafia text-2xl');

// 2. Reduce Name font size and tracking
code = code.replace(/flex-1 min-w-0 text-left truncate px-4 font-bold text-yellow-400 text-3xl uppercase tracking-widest/g, 'flex-1 min-w-0 text-left truncate px-2 font-bold text-yellow-400 text-xl md:text-2xl uppercase tracking-tight');
code = code.replace(/flex-1 min-w-0 text-left truncate px-4 font-bold text-white text-xl uppercase tracking-widest/g, 'flex-1 min-w-0 text-left truncate px-2 font-bold text-white text-base md:text-lg uppercase tracking-tight');

// 3. Reduce Amount font size
code = code.replace(/text-\[3\.5rem\] text-yellow-400/g, 'text-5xl text-yellow-400');
code = code.replace(/text-4xl text-emerald-400/g, 'text-3xl md:text-4xl text-emerald-400');

// 4. Reduce gap
code = code.replace(/gap-4 px-4/g, 'gap-2 px-3');

fs.writeFileSync('client/main_tv.html', code);
console.log('Patched layout to fit Payouts box perfectly');
