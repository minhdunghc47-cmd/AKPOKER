const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

// Name sizing
code = code.replace(/text-xl md:text-2xl uppercase tracking-tight/g, 'text-lg md:text-xl uppercase tracking-tight');
code = code.replace(/text-base md:text-lg uppercase tracking-tight/g, 'text-sm md:text-base uppercase tracking-tight');

// Amount sizing
code = code.replace(/text-5xl text-yellow-400 font-bold tracking-tight/g, 'text-4xl text-yellow-400 font-bold tracking-tighter');
code = code.replace(/text-3xl md:text-4xl text-emerald-400 font-bold tracking-tight/g, 'text-2xl md:text-3xl text-emerald-400 font-bold tracking-tighter');

// Symbol sizing
code = code.replace(/amountSymbolStyle = isTop1 \? 'text-2xl' : 'text-xl'/g, "amountSymbolStyle = isTop1 ? 'text-xl' : 'text-lg'");

fs.writeFileSync('client/main_tv.html', code);
console.log('Reduced amount font size and adjusted name size');
