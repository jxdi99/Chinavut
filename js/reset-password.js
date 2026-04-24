import { StaffAPI, supabase } from '../src/api/client.js';

(function () {
    let verifiedStaff = null;

    function showStep(step) {
        document.querySelectorAll('.reset-step').forEach(el => el.classList.remove('active'));
        document.getElementById(`reset-step-${step}`).classList.add('active');
        for (let i = 1; i <= 3; i++) {
            const dot = document.getElementById(`dot-${i}`);
            dot.classList.remove('active', 'done');
            if (i < step) dot.classList.add('done');
            if (i === step) dot.classList.add('active');
        }
    }

    function init() {
        // Step 1: Verify by Username + Email
        document.getElementById('reset-verify').addEventListener('click', async () => {
            const username = document.getElementById('reset-username').value.trim();
            const email = document.getElementById('reset-email').value.trim();

            if (!username || !email) {
                App.showToast('กรุณากรอก Username และอีเมลให้ครบ');
                return;
            }

            App.showToast('กำลังตรวจสอบ...');
            const staff = await StaffAPI.getByUsername(username);

            if (!staff) {
                App.showToast('ไม่พบ Username นี้ในระบบ');
                return;
            }

            if (!staff.email || staff.email.toLowerCase() !== email.toLowerCase()) {
                App.showToast('อีเมลไม่ตรงกับข้อมูลในระบบ');
                return;
            }

            verifiedStaff = staff;
            App.showToast('ยืนยันตัวตนสำเร็จ!');
            showStep(2);
            document.getElementById('reset-new-password').focus();
        });

        // Step 2: Back
        document.getElementById('reset-back').addEventListener('click', () => showStep(1));

        // Step 2: Save new password
        document.getElementById('reset-save').addEventListener('click', async () => {
            const newPw = document.getElementById('reset-new-password').value;
            const confirmPw = document.getElementById('reset-confirm-password').value;

            if (!newPw) {
                App.showToast('กรุณากรอกรหัสผ่านใหม่');
                return;
            }
            if (newPw.length < 3) {
                App.showToast('รหัสผ่านต้องมีอย่างน้อย 3 ตัวอักษร');
                return;
            }
            if (newPw !== confirmPw) {
                App.showToast('รหัสผ่านไม่ตรงกัน กรุณาพิมพ์ใหม่');
                return;
            }

            App.showToast('กำลังบันทึก...');
            const { error } = await supabase.rpc('update_staff_password', { 
                staff_id: verifiedStaff.id, 
                new_password: newPw 
            });

            if (error) {
                App.showToast('เกิดข้อผิดพลาด: ' + error.message);
                return;
            }

            showStep(3);
        });

        // Enter key support
        document.getElementById('reset-username').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('reset-email').focus();
        });
        document.getElementById('reset-email').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('reset-verify').click();
        });
        document.getElementById('reset-new-password').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('reset-confirm-password').focus();
        });
        document.getElementById('reset-confirm-password').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('reset-save').click();
        });

        // Toggle Password Visibility
        const toggleNewPw = document.getElementById('toggle-new-password');
        const newPwInput = document.getElementById('reset-new-password');
        if (toggleNewPw && newPwInput) {
            toggleNewPw.addEventListener('click', () => {
                const type = newPwInput.getAttribute('type') === 'password' ? 'text' : 'password';
                newPwInput.setAttribute('type', type);
                toggleNewPw.textContent = type === 'password' ? 'แสดง' : 'ซ่อน';
            });
        }

        const toggleConfirmPw = document.getElementById('toggle-confirm-password');
        const confirmPwInput = document.getElementById('reset-confirm-password');
        if (toggleConfirmPw && confirmPwInput) {
            toggleConfirmPw.addEventListener('click', () => {
                const type = confirmPwInput.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmPwInput.setAttribute('type', type);
                toggleConfirmPw.textContent = type === 'password' ? 'แสดง' : 'ซ่อน';
            });
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
