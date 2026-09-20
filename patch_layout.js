const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

// 1. Grid gap and padding
code = code.replace(/<div id="tables-container" class="grid grid-cols-1 xl:grid-cols-2 gap-12 p-6 pb-24"><\/div>/, '<div id="tables-container" class="grid grid-cols-1 xl:grid-cols-2 gap-8 p-4 pb-24 justify-items-center w-full"></div>');

// 2. Table wrapper size
code = code.replace(/tableWrapper\.className = 'w-full max-w-\[680px\] h-\[340px\] mx-auto relative mt-8 mb-8';/, "tableWrapper.className = 'w-full max-w-[850px] h-[400px] sm:h-[420px] mx-auto relative mt-12 mb-12 flex-1';");

// 3. Seat CSS size
code = code.replace(/width: 68px; height: 68px;/, 'width: 86px; height: 86px;');

// 4. Seat inner HTML font sizes
// Replace text-[9px] text-[#d4af37] => text-[11px]
code = code.replace(/text-\[9px\] text-\[#d4af37\]/g, 'text-[11px] text-[#d4af37]');
// Replace text-[11px] text-white => text-[13px] text-white
code = code.replace(/text-\[11px\] text-white/g, 'text-[14px] text-white');
// Replace text-[8px] text-gray-500 => text-[10px] text-gray-500
code = code.replace(/text-\[8px\] text-gray-500/g, 'text-[10px] text-gray-500');
// Replace Lượt font size text-[8px] => text-[10px]
code = code.replace(/text-\[8px\] font-bold shadow-md/g, 'text-[10px] font-bold shadow-md');

// For the image avatar text
code = code.replace(/<div class="text-\[8px\] text-white font-bold truncate px-1">/g, '<div class="text-[11px] text-white font-bold truncate px-1 pb-1">');
// Change -bottom-3 to -bottom-4 for the buyin tag to fit the larger seat
code = code.replace(/<div class="absolute -bottom-3 left-1\/2 -translate-x-1\/2/g, '<div class="absolute -bottom-4 left-1/2 -translate-x-1/2');


fs.writeFileSync('client/floor_ipad.html', code);
console.log('Patched layout');
