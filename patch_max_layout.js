const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

// 1. Grid gap and padding
code = code.replace(
    /class="grid grid-cols-1 xl:grid-cols-2 gap-8 p-4 pb-24 justify-items-center w-full"/,
    'class="grid grid-cols-1 xl:grid-cols-2 gap-4 px-1 py-4 pb-24 justify-items-center w-full"'
);

// 2. Table wrapper size
code = code.replace(
    /tableWrapper\.className = 'w-full max-w-\[850px\] h-\[400px\] sm:h-\[420px\] mx-auto relative mt-12 mb-12 flex-1';/,
    "tableWrapper.className = 'w-full xl:w-[46vw] h-[400px] md:h-[480px] xl:h-[500px] mx-auto relative my-8 flex-1';"
);

// 3. Seat CSS size
code = code.replace(/width: 86px; height: 86px;/, 'width: 96px; height: 96px;');

// 4. Seat inner HTML font sizes
// Replace text-[11px] text-[#d4af37] => text-sm
code = code.replace(/text-\[11px\] text-\[#d4af37\]/g, 'text-sm text-[#d4af37]');
// Replace text-[14px] text-white => text-base
code = code.replace(/text-\[14px\] text-white/g, 'text-base text-white');
// Replace text-[10px] text-gray-500 => text-xs mt-1
code = code.replace(/text-\[10px\] text-gray-500 font-bold leading-tight/g, 'text-xs text-gray-500 font-bold leading-tight mt-1');
// For the image avatar text
code = code.replace(/text-\[11px\] text-white font-bold truncate px-1 pb-1/g, 'text-[13px] text-white font-bold truncate px-1 pb-1');
// Lượt font size text-[10px] => text-xs, adjust padding and position
code = code.replace(
    /-bottom-4 left-1\/2 -translate-x-1\/2 bg-\[#222\] border border-\[#d4af37\] text-\[#d4af37\] px-1\.5 py-0\.5 rounded-full text-\[10px\]/g,
    '-bottom-5 left-1/2 -translate-x-1/2 bg-[#222] border border-[#d4af37] text-[#d4af37] px-2 py-0.5 rounded-full text-xs'
);

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Patched layout to MAX size');
