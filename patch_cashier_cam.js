const fs = require('fs');
let code = fs.readFileSync('client/cashier.html', 'utf8');

const oldCapture = /function captureKYC\(\) \{[\s\S]*?avatarBase64 = canvas\.toDataURL\('image\/jpeg', 0\.8\);/;
const newCapture = `function captureKYC() {
            const video = document.getElementById('kyc-video');
            if(!stream || video.classList.contains('hidden')) return alert("Vui lòng Bật Mâm (Camera) trước khi chụp!");
            
            const size = 150;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Calculate crop to make it square
            const minDim = Math.min(video.videoWidth, video.videoHeight);
            const sx = (video.videoWidth - minDim) / 2;
            const sy = (video.videoHeight - minDim) / 2;
            
            // Flip horizontal for mirror effect
            ctx.translate(size, 0);
            ctx.scale(-1, 1);
            
            ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
            
            avatarBase64 = canvas.toDataURL('image/jpeg', 0.7);`;

code = code.replace(oldCapture, newCapture);
fs.writeFileSync('client/cashier.html', code);
console.log('Patched captureKYC');
