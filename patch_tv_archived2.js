const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

// 1. Handle archived state to reset the screen
const archivedLogic = `
        if(!tour || tour.status === 'archived') {
            document.getElementById('main-tv').classList.add('hidden');
            document.getElementById('main-tv').classList.remove('flex');
            document.getElementById('setup-menu').classList.remove('hidden');
            if (window.realtimeInterval) clearInterval(window.realtimeInterval);
            return;
        }
`;
code = code.replace(
    /if\(!tour\) return;/g,
    archivedLogic
);

// 2. Fix payout generation based on entries
const oldPayoutGen = `            // Generate mock payouts if needed (50%, 30%, 20% for top 3)
            let payoutsToRender = [];
            if (pool > 0) {
                payoutsToRender = [
                    { rank: 1, amount: pool * 0.5 },
                    { rank: 2, amount: pool * 0.3 },
                    { rank: 3, amount: pool * 0.2 },
                ];
                
                // if alive is > 3, show more? Just mock.
            }`;

const newPayoutGen = `            // Generate smart ITM payouts
            let payoutsToRender = [];
            const e = tour.entries || 0;
            if (pool > 0) {
                if (e <= 5) {
                    payoutsToRender = [{ rank: 1, amount: pool }];
                } else if (e <= 10) {
                    payoutsToRender = [{ rank: 1, amount: pool * 0.65 }, { rank: 2, amount: pool * 0.35 }];
                } else if (e <= 20) {
                    payoutsToRender = [{ rank: 1, amount: pool * 0.50 }, { rank: 2, amount: pool * 0.30 }, { rank: 3, amount: pool * 0.20 }];
                } else if (e <= 40) {
                    payoutsToRender = [{ rank: 1, amount: pool * 0.45 }, { rank: 2, amount: pool * 0.25 }, { rank: 3, amount: pool * 0.15 }, { rank: 4, amount: pool * 0.10 }, { rank: 5, amount: pool * 0.05 }];
                } else {
                    payoutsToRender = [{ rank: 1, amount: pool * 0.40 }, { rank: 2, amount: pool * 0.25 }, { rank: 3, amount: pool * 0.15 }, { rank: 4, amount: pool * 0.10 }, { rank: 5, amount: pool * 0.06 }, { rank: 6, amount: pool * 0.04 }];
                }
            }`;

code = code.replace(oldPayoutGen, newPayoutGen);

fs.writeFileSync('client/main_tv.html', code);
console.log('Patched main_tv.html safely');
