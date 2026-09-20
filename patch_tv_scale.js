const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

// Scale stat fonts
code = code.replace(
    /\.stat-title { font-size: 1\.5rem;/g,
    ".stat-title { font-size: clamp(1rem, 1.2vw, 1.8rem);"
);
code = code.replace(
    /\.stat-val { font-size: 2\.5rem;/g,
    ".stat-val { font-size: clamp(1.8rem, 2.5vw, 3.5rem);"
);

// Scale Average Stack
code = code.replace(
    /text-\[3\.5rem\]/g,
    'text-[clamp(3rem,3.5vw,4.5rem)]'
);

// Scale BB text
code = code.replace(
    /text-2xl bg-\[#d4af37\]\/10/g,
    'text-[clamp(1.5rem,1.8vw,2rem)] bg-[#d4af37]/10'
);

// Scale Level Name
code = code.replace(
    /text-5xl md:text-\[4rem\]/g,
    'text-[clamp(3rem,4vw,5rem)]'
);

// Scale "TABLES ACTIVE"
code = code.replace(
    /text-sm tracking-widest border-t/g,
    'text-[clamp(0.8rem,1vw,1.2rem)] tracking-widest border-t'
);

// Scale "REG CLOSES" Lvl 8 text (if hardcoded, wait, it uses stat-val)

// Bottom bar scaling
code = code.replace(
    /text-xs font-bold tracking-widest uppercase/g,
    'text-[clamp(0.7rem,0.9vw,1rem)] font-bold tracking-widest uppercase'
);
code = code.replace(
    /text-2xl tracking-widest" id="tv-next-break"/g,
    'text-[clamp(1.5rem,1.8vw,2.5rem)] tracking-widest" id="tv-next-break"'
);
code = code.replace(
    /text-3xl font-teko tracking-wider/g,
    'text-[clamp(2rem,2.5vw,3.5rem)] font-teko tracking-wider'
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Applied fluid scalable typography for 32 inch 16:9 TVs');
