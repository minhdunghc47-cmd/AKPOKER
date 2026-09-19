const fs = require('fs');
let code = fs.readFileSync('client/hr_management.html', 'utf8');

// Replace onclick editStaff arguments to pass the object instead of positional args
code = code.replace(
  /onclick="editStaff\('\$\{s\.id\}', '\$\{s\.name\}', '\$\{s\.pin\}', '\$\{s\.role\}', \$\{s\.base_salary\}\)"/,
  "onclick='editStaff(JSON.stringify(s))'"
);

// Add Camera Logic JS
const cameraJs = `
        let isEditing = false;
        let currentPhotoBase64 = '';
        let stream = null;

        async function startCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const video = document.getElementById('camera-stream');
                video.srcObject = stream;
                video.classList.remove('hidden');
                document.getElementById('photo-preview').classList.add('hidden');
                document.getElementById('photo-placeholder').classList.add('hidden');
                
                document.getElementById('btn-start-camera').classList.add('hidden');
                document.getElementById('btn-take-photo').classList.remove('hidden');
            } catch (err) {
                alert("Không thể truy cập Camera: " + err.message);
            }
        }

        function takePhoto() {
            if (!stream) return;
            const video = document.getElementById('camera-stream');
            const canvas = document.getElementById('photo-canvas');
            const ctx = canvas.getContext('2d');
            
            // Draw video frame to 300x300 canvas
            ctx.drawImage(video, 0, 0, 300, 300);
            currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            // Stop camera
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            
            // Show preview
            video.classList.add('hidden');
            const preview = document.getElementById('photo-preview');
            preview.src = currentPhotoBase64;
            preview.classList.remove('hidden');
            
            document.getElementById('btn-start-camera').classList.remove('hidden');
            document.getElementById('btn-start-camera').innerHTML = '<i class="fa-solid fa-camera mr-1"></i> Chụp Lại';
            document.getElementById('btn-take-photo').classList.add('hidden');
        }

        function editStaff(staffStr) {
            const s = JSON.parse(staffStr);
            isEditing = true;
            document.getElementById('hr-id').value = s.id;
            document.getElementById('hr-id').disabled = true;
            document.getElementById('hr-id').classList.add('opacity-50', 'cursor-not-allowed');
            
            document.getElementById('hr-name').value = s.name;
            document.getElementById('hr-pin').value = s.pin || '';
            document.getElementById('hr-role').value = s.role;
            document.getElementById('hr-salary').value = s.base_salary;
            
            document.getElementById('hr-dob').value = s.dob || '';
            document.getElementById('hr-cccd').value = s.cccd || '';
            document.getElementById('hr-cccd-date').value = s.cccd_date || '';
            document.getElementById('hr-address').value = s.address || '';
            
            if (s.photo) {
                currentPhotoBase64 = s.photo;
                const preview = document.getElementById('photo-preview');
                preview.src = s.photo;
                preview.classList.remove('hidden');
                document.getElementById('photo-placeholder').classList.add('hidden');
                document.getElementById('btn-start-camera').innerHTML = '<i class="fa-solid fa-camera mr-1"></i> Chụp Lại';
            } else {
                currentPhotoBase64 = '';
                document.getElementById('photo-preview').classList.add('hidden');
                document.getElementById('photo-placeholder').classList.remove('hidden');
                document.getElementById('btn-start-camera').innerHTML = '<i class="fa-solid fa-camera mr-1"></i> Bật Camera';
            }
            
            if(stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                document.getElementById('camera-stream').classList.add('hidden');
                document.getElementById('btn-start-camera').classList.remove('hidden');
                document.getElementById('btn-take-photo').classList.add('hidden');
            }
            
            document.getElementById('btn-submit').innerHTML = '<i class="fa-solid fa-save mr-2"></i> CẬP NHẬT';
            document.getElementById('btn-submit').classList.replace('bg-[#d4af37]', 'bg-blue-600');
            document.getElementById('btn-submit').classList.replace('hover:bg-[#b5952f]', 'hover:bg-blue-500');
            document.getElementById('btn-cancel').classList.remove('hidden');
            document.getElementById('btn-resign').classList.remove('hidden');
        }
`;

// Replace editStaff block up to resetStaffForm
const editStaffRegex = /let isEditing = false;[\s\S]*?function resetStaffForm\(\) \{/;
code = code.replace(editStaffRegex, cameraJs + "\n        function resetStaffForm() {");

// Update resetStaffForm
const resetUpdates = `
            document.getElementById('hr-dob').value = '';
            document.getElementById('hr-cccd').value = '';
            document.getElementById('hr-cccd-date').value = '';
            document.getElementById('hr-address').value = '';
            
            currentPhotoBase64 = '';
            document.getElementById('photo-preview').classList.add('hidden');
            document.getElementById('photo-placeholder').classList.remove('hidden');
            document.getElementById('btn-start-camera').innerHTML = '<i class="fa-solid fa-camera mr-1"></i> Bật Camera';
            
            if(stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                document.getElementById('camera-stream').classList.add('hidden');
                document.getElementById('btn-start-camera').classList.remove('hidden');
                document.getElementById('btn-take-photo').classList.add('hidden');
            }
`;
code = code.replace(/document\.getElementById\('hr-salary'\)\.value = '50000';/, "document.getElementById('hr-salary').value = '50000';" + resetUpdates);

// Update submitStaff
const payloadUpdates = `
                dob: document.getElementById('hr-dob').value,
                cccd: document.getElementById('hr-cccd').value,
                cccd_date: document.getElementById('hr-cccd-date').value,
                address: document.getElementById('hr-address').value,
                photo: currentPhotoBase64
`;
code = code.replace(/base_salary: document\.getElementById\('hr-salary'\)\.value/, "base_salary: document.getElementById('hr-salary').value,\n" + payloadUpdates);


fs.writeFileSync('client/hr_management.html', code);
