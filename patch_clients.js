const fs = require('fs');

// --- 1. main_tv.html ---
let tvCode = fs.readFileSync('client/main_tv.html', 'utf8');

// Inject banner HTML right before <!-- CLOCK -->
const bannerHtml = `
            <!-- DEALING LOCK BANNER -->
            <div id="tv-dealing-lock-banner" class="hidden absolute top-[15vh] w-full text-center z-50">
                <div class="inline-block bg-red-600 text-yellow-300 font-mafia text-4xl px-12 py-3 rounded-full shadow-[0_0_50px_rgba(255,0,0,0.8)] border-4 border-yellow-300 animate-pulse tracking-widest whitespace-nowrap">
                    <i class="fa-solid fa-triangle-exclamation mr-3 text-white"></i> 
                    ĐỒNG HỒ ĐANG CHẠY - CHỜ ĐỦ <span id="tv-lock-min-players">6</span> NGƯỜI CHƠI ĐỂ BẮT ĐẦU CHIA BÀI
                </div>
            </div>
`;
tvCode = tvCode.replace(/<!-- CLOCK -->/, bannerHtml.trim() + '\n            <!-- CLOCK -->');

// Inject logic in window.currentTour processing
const tvLogic = `
            const alivePlayers = currentTour.players ? currentTour.players.filter(p => p.status === 'alive').length : 0;
            const minPlayers = (currentTour.settings && currentTour.settings.min_players) ? currentTour.settings.min_players : 6;
            const banner = document.getElementById('tv-dealing-lock-banner');
            if (currentTour.status === 'running' && alivePlayers < minPlayers) {
                document.getElementById('tv-lock-min-players').innerText = minPlayers;
                banner.classList.remove('hidden');
            } else {
                banner.classList.add('hidden');
            }
`;
tvCode = tvCode.replace(/(document\.getElementById\('tv-players'\)\.innerText = currentTour\.players \? currentTour\.players\.filter\(p => p\.status === 'alive'\)\.length : 0;)/, "$1\n" + tvLogic);
fs.writeFileSync('client/main_tv.html', tvCode);


// --- 2. floor_ipad.html ---
let floorCode = fs.readFileSync('client/floor_ipad.html', 'utf8');

const overlayLogic = `
            const tour = activeTours.find(t => t.id === tbl.tour_id);
            let overlayHtml = '';
            let isDealingLocked = false;
            
            if (tour) {
                const alivePlayers = tour.players ? tour.players.filter(p => p.status === 'alive').length : 0;
                const minPlayers = (tour.settings && tour.settings.min_players) ? tour.settings.min_players : 6;
                if (tour.status === 'running' && alivePlayers < minPlayers) {
                    isDealingLocked = true;
                    overlayHtml = \`
                        <div class="absolute inset-0 bg-red-900/80 z-20 flex flex-col justify-center items-center rounded-xl border border-red-500 backdrop-blur-sm pointer-events-none">
                            <i class="fa-solid fa-lock text-4xl text-yellow-300 mb-2 drop-shadow-[0_0_10px_rgba(255,0,0,1)]"></i>
                            <div class="text-white font-bold text-lg text-center leading-tight drop-shadow-md">
                                CHƯA ĐỦ \${minPlayers} PLAYER<br>
                                <span class="text-yellow-300 text-sm">HOLD DEALING</span>
                            </div>
                        </div>
                    \`;
                }
            }
`;

floorCode = floorCode.replace(/const totalPlayers = tblPlayers\.length;/, overlayLogic.trim() + '\n            const totalPlayers = tblPlayers.length;');

// We need to inject ${overlayHtml} into the table card HTML
floorCode = floorCode.replace(/<div class="bg-\[#1a1a1a\] border border-\[#d4af37\] rounded-xl p-4 md:p-5 relative shadow-\[0_5px_15px_rgba\(0,0,0,0\.5\)\]">/, `<div class="bg-[#1a1a1a] border border-[#d4af37] rounded-xl p-4 md:p-5 relative shadow-[0_5px_15px_rgba(0,0,0,0.5)]">\n                \${overlayHtml}`);

fs.writeFileSync('client/floor_ipad.html', floorCode);
