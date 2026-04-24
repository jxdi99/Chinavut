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

        // Login Flow
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
            App.showToast(`${App.t('welcome')} คุณ ${firstName}`);
            
            App.state.currentUser = { 
                id: val, 
                name: firstName,
                fullName: staff.name, 
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
