const fs = require('fs');
let code = fs.readFileSync('client/index.html', 'utf8');

const newLoginUI = `
            <div class="mb-4">
                <h2 class="text-xl font-mafia text-[#d4af37] uppercase tracking-widest">Đăng Nhập Hệ Thống</h2>
                <p class="text-xs text-gray-500 mt-2 uppercase">Xác thực bằng Tài khoản Firebase</p>
            </div>
            
            <input type="email" id="email-input" class="w-full bg-[#0a0a0a] border border-[#333] focus:border-[#d4af37] rounded-lg px-4 py-3 text-white mb-4 outline-none transition-colors" placeholder="Email nhân viên" autocomplete="off">
            <input type="password" id="password-input" class="w-full bg-[#0a0a0a] border border-[#333] focus:border-[#d4af37] rounded-lg px-4 py-3 text-white mb-6 outline-none transition-colors" placeholder="Mật khẩu" autocomplete="off">
            
            <p id="pin-error" class="text-red-500 text-xs text-center font-bold uppercase hidden mb-4 -mt-2">Đăng nhập thất bại!</p>
            
            <div class="grid grid-cols-2 gap-3">
                <button class="bg-[#222] hover:bg-[#333] text-gray-400 font-bold py-4 rounded-lg transition-colors border border-[#333]" onclick="closePinModal()">HỦY</button>
                <button class="bg-[#d4af37] hover:bg-[#b5952f] text-black font-bold py-4 rounded-lg transition-colors border border-[#b5952f]" onclick="verifyPin()">ĐĂNG NHẬP</button>
            </div>
`;

code = code.replace(
    /<div class="mb-8 text-center">[\s\S]*?<\/div>\s*<\/div>/,
    newLoginUI + "\n        </div>\n    </div>"
);

// We must also update the Firebase SDK injection and logic
const newScript = `
    <!-- Firebase App (the core Firebase SDK) is always required and must be listed first -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>

    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script>
        // Cấu hình Firebase (Staging) sẽ được điền ở đây
        const firebaseConfig = {
            // apiKey: "...",
            // authDomain: "...",
            // projectId: "..."
        };
        // firebase.initializeApp(firebaseConfig);

        let socket = null;

        function connectSocket(token) {
            socket = io('https://akpoker.onrender.com', {
                auth: { token: token }
            });
            
            // ... status UI handlers ...
            socket.on('connect', () => {
                document.getElementById('status-box').className = "absolute bottom-6 right-8 flex items-center space-x-3 bg-[#111] px-4 py-2 rounded-full border border-[#2ecc71]/40 shadow-lg z-20";
                document.getElementById('status-dot').className = "w-2.5 h-2.5 bg-[#2ecc71] rounded-full pulse-dot";
                document.getElementById('status-text').className = "text-[#2ecc71] font-bold text-[10px] tracking-widest uppercase";
                document.getElementById('status-text').innerText = "Connected (Authenticated)";
            });
            
            socket.on('connect_error', (err) => {
                alert("Lỗi kết nối Socket: " + err.message);
            });
        }

        // Tạm thời để trống socket lúc đầu, chỉ kết nối khi có token trong localStorage (nếu đã đăng nhập)
        window.onload = () => {
            const token = sessionStorage.getItem('acepoker_token');
            if (token) connectSocket(token);
        };
        
        // Modal Logic
        let targetLink = '';
        const modal = document.getElementById('pin-modal');
        const emailInput = document.getElementById('email-input');
        const pwdInput = document.getElementById('password-input');
        const errorMsg = document.getElementById('pin-error');

        function openPinModal(link, role) {
            targetLink = link;
            emailInput.value = '';
            pwdInput.value = '';
            errorMsg.classList.add('hidden');
            modal.classList.remove('hidden');
        }

        function closePinModal() {
            modal.classList.add('hidden');
        }

        async function verifyPin() {
            const email = emailInput.value;
            const pwd = pwdInput.value;
            
            try {
                // Giả lập call Firebase Auth (Trong môi trường thực sẽ gọi firebase.auth().signInWithEmailAndPassword)
                // const userCredential = await firebase.auth().signInWithEmailAndPassword(email, pwd);
                // const token = await userCredential.user.getIdToken();
                const token = "MOCK_TOKEN_FOR_STAGING_UI"; 
                
                sessionStorage.setItem('acepoker_token', token);
                window.location.href = targetLink;
            } catch(e) {
                errorMsg.innerText = e.message || "Đăng nhập thất bại!";
                errorMsg.classList.remove('hidden');
            }
        }
`;

code = code.replace(
    /<script src="https:\/\/cdn\.socket\.io\/4\.7\.2\/socket\.io\.min\.js"><\/script>\n\s*<script>[\s\S]*?function verifyPin\(\) \{[\s\S]*?\}\n/m,
    newScript
);

// Remove the keyboard logic that fails now
code = code.replace(
    /\/\/ KEYBOARD & NUMPAD LOGIC[\s\S]*?}\);/m,
    ""
);

fs.writeFileSync('client/index.html', code);
console.log('Patched index.html');
