const fs = require('fs');
let code = fs.readFileSync('client/god_mode.html', 'utf8');

const calculateFunc = `
        function calculateTotalFinances(all_tours) {
            let totalNet = 0;
            let totalDebt = 0;
            let totalRake = 0;

            all_tours.forEach(t => {
                if (t.status === 'finished' || t.status === 'ended' || t.status === 'archived') {
                    const paid = (t.fund && t.fund.total_paid) ? t.fund.total_paid : 0;
                    const debt = (t.fund && t.fund.debt) ? t.fund.debt : 0;
                    const expenses = (t.fund && t.fund.expenses) ? t.fund.expenses : 0;
                    const prizePool = (t.fund && t.fund.payout_pool) ? t.fund.payout_pool : (paid * 0.85); // fallback
                    
                    const buyinFee = Number(t.buyin_fee) || 0;
                    const entries = Number(t.entries) || 0;
                    
                    // Tính Rake theo chuẩn: (Tổng số vé * Mức phí Buy-in) - Prize Pool
                    // Nếu buyin_fee không được setup (bằng 0), fallback: Rake = Tổng thu - Prize Pool
                    let expectedTotal = (entries * buyinFee);
                    if (expectedTotal === 0) expectedTotal = paid + debt;
                    
                    let rake = expectedTotal - prizePool - expenses;
                    
                    // Cộng dồn
                    totalNet += (paid - expenses);
                    totalDebt += debt;
                    totalRake += rake;
                }
            });

            document.getElementById('val-net').innerText = formatMoney(totalNet);
            document.getElementById('val-debt').innerText = formatMoney(totalDebt);
            document.getElementById('val-rake').innerText = formatMoney(totalRake);
        }
`;

// Inject function definition
code = code.replace(
    /socket\.on\('update_god_mode'/g,
    calculateFunc + "\n        socket.on('update_god_mode'"
);

// Inject function call inside update_god_mode
code = code.replace(
    /document\.getElementById\('val-net'\)\.innerText = formatMoney\(financial\.net_cash\);\s*document\.getElementById\('val-debt'\)\.innerText = formatMoney\(financial\.total_debt\);\s*document\.getElementById\('val-rake'\)\.innerText = formatMoney\(financial\.total_rake\);/g,
    "calculateTotalFinances(all_tours);"
);

fs.writeFileSync('client/god_mode.html', code);
console.log('Patched god_mode.html finances');
