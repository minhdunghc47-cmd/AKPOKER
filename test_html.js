const p = { rank: 1, amount: 1000 };
const bustedName = "TRẦN VĂN A";
const isTop1 = p.rank === 1;
const nameStyle = isTop1
    ? 'flex-1 text-left truncate font-bold text-yellow-400 text-3xl uppercase tracking-widest drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]'
    : 'flex-1 text-left truncate font-bold text-white text-xl uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]';

let nameHtml = '';
if (bustedName) {
    nameHtml = `<div class="${nameStyle}">${bustedName}</div>`;
} else {
    nameHtml = `<div class="flex-1 border-b-2 border-dashed border-[#333] opacity-70"></div>`;
}
console.log(nameHtml);
