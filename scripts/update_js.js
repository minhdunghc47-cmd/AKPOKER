const fs = require('fs');
let code = fs.readFileSync('client/td_dashboard.html', 'utf8');

// Thêm customTemplates và onPresetChange mới
const newJsTop = `
        let currentTables = [], selectedTables = new Set(), currentTours = [];
        let currentBlindsData = []; // Stateful Editable Grid Data
        let customTemplates = [];

        function openBlindsModal() { document.getElementById('blinds-modal').classList.replace('hidden', 'flex'); }
        function closeBlindsModal() { document.getElementById('blinds-modal').classList.replace('flex', 'hidden'); }

        socket.on('update_tour_templates', (templates) => {
            customTemplates = templates || [];
            updatePresetDropdown();
        });

        function updatePresetDropdown() {
            const select = document.getElementById('tour-preset');
            const currentVal = select.value;
            select.innerHTML = \`
                <option value="">-- Chọn Mẫu Giải --</option>
                <option value="hyper">Hyper Turbo (Lên Blinds Cực Nhanh)</option>
                <option value="regular">Regular Daily (Giải Thi Đấu Tiêu Chuẩn)</option>
                <option value="deepstack">Deepstack / High Roller (Stack Sâu)</option>
                <option value="custom">Tùy chỉnh (Custom)</option>
            \`;
            if (customTemplates.length > 0) {
                const group = document.createElement('optgroup');
                group.label = 'Mẫu Của TD (Tự Tạo)';
                customTemplates.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.innerText = t.name;
                    group.appendChild(opt);
                });
                select.appendChild(group);
            }
            if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
                select.value = currentVal;
            }
        }

        function saveTemplate() {
            const nameInput = prompt('Nhập tên mẫu giải đấu muốn lưu (VD: Giải Tốc Độ Cuối Tuần):');
            if (!nameInput) return;
            if (currentBlindsData.length === 0) return alert("Vui lòng vào 'CẤU HÌNH BLINDS CHI TIẾT' tạo cấu trúc trước khi lưu mẫu!");
            
            const startStack = document.getElementById('starting-stack').value;
            const lateReg = document.getElementById('late-reg-input').value;
            const buyIn = document.getElementById('buy-in-fee').value;
            
            socket.emit('save_template', {
                name: nameInput,
                starting_stack: Number(startStack),
                late_reg_level: Number(lateReg),
                buyin_fee: Number(buyIn),
                blinds: currentBlindsData
            }, (res) => {
                alert(res.message);
            });
        }
`;

code = code.replace(/let currentTables = \[\], selectedTables = new Set\(\), currentTours = \[\];\s*let currentBlindsData = \[\];[^\n]*\n/, newJsTop);

const newPresetChange = `
        function onPresetChange() {
            const val = document.getElementById('tour-preset').value;
            const lateInput = document.getElementById('late-reg-input');
            const nameInput = document.getElementById('tour-name');
            const stackInput = document.getElementById('starting-stack');
            const buyinInput = document.getElementById('buy-in-fee');
            
            if (val) {
                let data = TOURNAMENT_PRESETS[val] || customTemplates.find(t => t.id === val);
                if (data) {
                    nameInput.value = data.name;
                    stackInput.value = data.starting_stack;
                    if (data.buyin_fee) buyinInput.value = data.buyin_fee;
                    lateInput.value = data.late_reg_level || 8;
                    currentBlindsData = JSON.parse(JSON.stringify(data.blinds || []));
                    renderEditableBlinds();
                }
            } else {
                nameInput.value = '';
                currentBlindsData = [];
                renderEditableBlinds();
            }
        }
`;

const oldPresetChangeRegex = /function onPresetChange\(\) \{[\s\S]*?\}(?=\s*\/\/ --- REGULAR TV GRID LOGIC ---)/;
code = code.replace(oldPresetChangeRegex, newPresetChange);

fs.writeFileSync('client/td_dashboard.html', code);
console.log('Done JS update');
