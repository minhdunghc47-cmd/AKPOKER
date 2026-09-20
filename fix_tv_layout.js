const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

// 1. Change layout proportions
// Left Column
code = code.replace(/<div class="w-\[28%\] bg-\[#081020\]\/80 border-r border-\[#d4af37\]\/20 flex flex-col p-8 justify-between z-0">/, '<div class="w-[25%] bg-[#081020]/80 border-r border-[#d4af37]/20 flex flex-col p-8 justify-between z-0">');

// Center Column
code = code.replace(/<div class="w-\[44%\] bg-gradient-to-b from-\[#0f172a\] to-\[#050b14\] flex flex-col justify-center items-center relative shadow-\[0_0_50px_rgba\(0,0,0,0\.5\)\] z-20 border-x-4 border-black">/, '<div class="w-[50%] min-w-0 overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#050b14] flex flex-col justify-center items-center relative shadow-[0_0_50px_rgba(0,0,0,0.5)] z-20 border-x-4 border-black">');

// Right Column
code = code.replace(/<div class="w-\[28%\] bg-\[#081020\]\/80 border-l border-\[#d4af37\]\/20 flex flex-col relative z-0">/, '<div class="w-[25%] bg-[#081020]/80 border-l border-[#d4af37]/20 flex flex-col relative z-0">');


// 2. Fix Clock overflow
// Find the clock div
code = code.replace(
    /<div id="tv-clock" class="font-digital text-\[15rem\] leading-none tracking-widest text-white drop-shadow-\[0_0_30px_rgba\(255,255,255,0\.3\)\]">/,
    '<div id="tv-clock" class="font-digital text-[clamp(6rem,15vw,16rem)] leading-none tracking-tighter whitespace-nowrap text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">'
);

// Also slightly reduce blinds if they overflow
code = code.replace(
    /font-teko text-\[7rem\] leading-none text-emerald-400 font-bold/,
    'font-teko text-[clamp(4rem,7vw,7rem)] leading-none text-emerald-400 font-bold whitespace-nowrap'
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Fixed TV layout');
