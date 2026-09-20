const fs = require('fs');
let code = fs.readFileSync('client/hr_kiosk.html', 'utf8');

const oldListener = `        socket.on('update_state', (state) => {
            if (state.staff) {
                currentStaffList = state.staff;
                renderStaffDropdown();
            }
        });`;

const newListener = `        socket.on('connect', () => {
            socket.emit('request_initial_data');
        });

        socket.on('update_staff_list', (staffList) => {
            if (staffList) {
                currentStaffList = staffList;
                renderStaffDropdown();
            }
        });`;

code = code.replace(oldListener, newListener);
fs.writeFileSync('client/hr_kiosk.html', code);
