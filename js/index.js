import { StaffAPI } from '../src/api/client.js';

(function () {
    async function init() {
        const state = await AppStorage.loadState();
        App.state = state;
        App.applyLanguage();
        App.applyTheme(state.ui.theme);

        const input = document.getElementById('username');
        const submitBtn = document.getElementById('login-submit');

        // Toggle password visibility
        document.getElementById('toggle-password').addEventListener('click', () => {
            const pwInput = document.getElementById('password');
            const btn = document.getElementById('toggle-password');
            if (pwInput.type === 'password') {
                pwInput.type = 'text';
                btn.textContent = 'ซ่อน';
            } else {
                pwInput.type = 'password';
                btn.textContent = 'แสดง';
            }
        });

        // ==========================================
        // Forgot Password - Multi-step Reset Flow
        // ==========================================
        let verifiedStaff = null;

        document.getElementById('forgot-password').addEventListener('click', (e) => {
            e.preventDefault();
            showStep(1);
            document.getElementById('reset-modal').classList.add('active');
            document.getElementById('reset-username').value = '';
            document.getElementById('reset-email').value = '';
            document.getElementById('reset-username').focus();
        });

        document.getElementById('reset-cancel').addEventListener('click', () => {
            document.getElementById('reset-modal').classList.remove('active');
        });

        document.getElementById('reset-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('reset-modal')) {
                document.getElementById('reset-modal').classList.remove('active');
            }
        });

        // Step 1: Verify identity (username + email)
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

            // Verified!
            verifiedStaff = staff;
            showStep(2);
            document.getElementById('reset-new-password').value = '';
            document.getElementById('reset-confirm-password').value = '';
            document.getElementById('reset-new-password').focus();
        });

        // Step 2: Back button
        document.getElementById('reset-back').addEventListener('click', () => {
            showStep(1);
        });

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

            // Update password in Supabase staff table
            const { supabase } = await import('../src/api/client.js');
            const { error } = await supabase
                .from('staff')
                .update({ password: newPw })
                .eq('id', verifiedStaff.id);

            if (error) {
                console.error('Password update error:', error);
                App.showToast('เกิดข้อผิดพลาด: ' + error.message);
                return;
            }

            // Success!
            showStep(3);
        });

        // Step 3: Done
        document.getElementById('reset-done').addEventListener('click', () => {
            document.getElementById('reset-modal').classList.remove('active');
            verifiedStaff = null;
        });

        function showStep(step) {
            document.querySelectorAll('.reset-step').forEach(el => el.classList.remove('active'));
            document.getElementById(`reset-step-${step}`).classList.add('active');
        }

        // ==========================================
        // Login Flow
        // ==========================================
        async function handleLogin() {
            const val = input.value.trim();
            const password = document.getElementById('password').value;
            if (!val || !password) {
                App.showToast('กรุณากรอก Username และรหัสผ่าน');
                return;
            }

            App.showToast(App.t('calculating'));
            
            const staff = await StaffAPI.getByUsername(val);
            if (!staff) {
                App.showToast('ไม่พบ Username นี้ในระบบ');
                return;
            }
            
            if (password !== staff.password) {
                App.showToast('รหัสผ่านไม่ถูกต้อง');
                return;
            }

            // Authentication Success
            const cleanName = (fullName) => {
                let name = fullName;
                const prefixes = ['นาย ', 'นางสาว ', 'น.ส. ', 'น.ส.', 'นาง '];
                for (const p of prefixes) {
                    if (name.startsWith(p)) {
                        name = name.substring(p.length).trim();
                        break;
                    }
                }
                return name.split(/\s+/)[0];
            };
            const firstName = cleanName(staff.name);
            console.log('Login Success:', staff);
            App.showToast(`${App.t('welcome')} คุณ ${firstName}`);
            
            App.state.currentUser = { 
                id: val, 
                name: firstName, 
                nick: staff.nick, 
                role: staff.role ? staff.role.toLowerCase() : 'employee',
                position: staff.position,
                status: staff.status 
            };
            await AppStorage.saveState(App.state);

            setTimeout(() => {
                window.location.href = './dashboard.html';
            }, 1000);
        }

        submitBtn.addEventListener('click', handleLogin);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        document.getElementById('password').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
