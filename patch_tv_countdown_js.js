const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

const jsLogic = `
        const isLateRegClosed = (currentLvlNum > lateRegLvlNum);
        
        // --- LATE REG COUNTDOWN LOGIC ---
        if (!isLateRegClosed) {
            let totalRemainingSec = tour.time_remaining || 0;
            for (let i = tour.current_level_idx + 1; i < tour.blinds_structure.length; i++) {
                const b = tour.blinds_structure[i];
                if (!b.is_break && b.level > lateRegLvlNum) {
                    break;
                }
                totalRemainingSec += (Number(b.duration) || 0) * 60;
            }
            
            let hr = Math.floor(totalRemainingSec / 3600);
            let min = Math.floor((totalRemainingSec % 3600) / 60);
            let sec = totalRemainingSec % 60;
            let formattedLateReg = '';
            
            if (hr > 0) {
                formattedLateReg = hr.toString().padStart(2, '0') + ':' + min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
            } else {
                formattedLateReg = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
            }
            
            const countdownEl = document.getElementById('tv-late-reg-countdown');
            if (countdownEl) countdownEl.innerText = 'ĐÓNG SAU: ' + formattedLateReg;
        }
        // --------------------------------
`;

code = code.replace(
    /const isLateRegClosed = \(currentLvlNum > lateRegLvlNum\);/g,
    jsLogic
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Patched JS logic for countdown timer');
