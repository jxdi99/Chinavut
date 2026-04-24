import { StaffAPI } from '../src/api/client.js';

(function () {
    async function init() {
        const state = await AppStorage.loadState();
        App.state = state;
        App.applyLanguage();
        App.applyTheme(state.ui.theme);



        const input = document.getElementById('username');
        const submitBtn = document.getElementById('login-submit');

        let isSignUpMode = false;
        
        document.getElementById('toggle-signup').addEventListener('click', (e) => {
            e.preventDefault();
            isSignUpMode = !isSignUpMode;
            document.getElementById('email-field').style.display = isSignUpMode ? 'block' : 'none';
            if (isSignUpMode) {
                submitBtn.textContent = 'ลงทะเบียน (Sign Up)';
                e.target.textContent = 'กลับไปหน้าเข้าสู่ระบบ (Login)';
            } else {
                submitBtn.textContent = App.t('loginBtn') || 'เข้าสู่ระบบ';
                e.target.textContent = 'ตั้งรหัสผ่านใหม่ (Sign Up)';
            }
        });

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

        // Forgot password - lookup by email in staff table
        document.getElementById('forgot-password').addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt('กรุณากรอกอีเมลที่ใช้ลงทะเบียน:');
            if (!email) return;
            const staff = await StaffAPI.getByEmail(email);
            if (staff) {
                alert(`ชื่อผู้ใช้: ${staff.nick}\nUsername: ${staff.username}\nรหัสผ่านของคุณคือ: ${staff.password}`);
            } else {
                App.showToast('ไม่พบอีเมลนี้ในระบบ');
            }
        });

        async function handleLogin() {
            const val = input.value.trim();
            const password = document.getElementById('password').value;
            if (!val || !password) {
                App.showToast('กรุณากรอกรหัสพนักงานและรหัสผ่าน');
                return;
            }

            App.showToast(App.t('calculating'));
            
            // Validate if username exists in staff table FIRST
            const staff = await StaffAPI.getByUsername(val);
            if (!staff) {
                App.showToast('ไม่พบ Username นี้ในระบบ');
                return;
            }
            
            // Simple Custom Login Flow (Bypass Supabase Auth)
            if (isSignUpMode) {
                // If they want to sign up, we just update the password in the staff table
                // Note: For this to work, we need an admin or they need to have a default password
                App.showToast('ระบบสมัครสมาชิกแบบ Custom ยังไม่เปิดใช้งาน กรุณาติดต่อแอดมิน');
                return;
            } else {
                // Check if password matches
                if (password !== staff.password) {
                    App.showToast('รหัสผ่านไม่ถูกต้อง');
                    return;
                }
            }

            // Authentication Success (Login or Signup)
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
            
            // Store logged in user in state
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
                // Use ./ to ensure it stays in the subfolder on GitHub Pages
                window.location.href = './dashboard.html';
            }, 1000);
        }



        submitBtn.addEventListener('click', handleLogin);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
