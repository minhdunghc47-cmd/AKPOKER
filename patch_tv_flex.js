const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

// 1. Container Style (Remove justify-between and gap-2/gap-4, keep items-center w-full)
code = code.replace(
    /const containerStyle = isTop1\s*\?\s*'flex items-center justify-between w-full gap-\d px-\d py-4 bg-gradient/g,
    "const containerStyle = isTop1\n                        ? 'flex items-center w-full px-4 py-4 bg-gradient"
);
code = code.replace(
    /\(bustedName\s*\?\s*'flex items-center justify-between w-full gap-\d px-\d py-3 bg-gradient/g,
    "(bustedName \n                            ? 'flex items-center w-full px-4 py-3 bg-gradient"
);
code = code.replace(
    /:\s*'flex items-center justify-between w-full gap-\d px-\d py-3 bg-\[#111\]/g,
    ": 'flex items-center w-full px-4 py-3 bg-[#111]"
);

// 2. Rank Style (Ensure w-16 shrink-0 text-center for all)
code = code.replace(
    /const rankStyle = isTop1\s*\?\s*'w-16 shrink-0 flex justify-center items-center/g,
    "const rankStyle = isTop1\n                        ? 'w-16 shrink-0 text-center flex justify-center items-center"
);
code = code.replace(
    /:\s*'w-14 shrink-0 flex justify-center items-center/g,
    ": 'w-16 shrink-0 text-center flex justify-center items-center"
);

// 3. Name Style (Add mx-4, keep flex-1 min-w-0 truncate)
code = code.replace(
    /const nameStyle = isTop1\s*\?\s*'flex-1 min-w-0 text-left truncate px-2/g,
    "const nameStyle = isTop1\n                        ? 'flex-1 min-w-0 mx-4 text-left truncate px-2"
);
code = code.replace(
    /:\s*'flex-1 min-w-0 text-left truncate px-2/g,
    ": 'flex-1 min-w-0 mx-4 text-left truncate px-2"
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Patched flexbox structure');
