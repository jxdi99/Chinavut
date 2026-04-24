import { StaffAPI } from '../src/api/client.js';

(function () {
    async function init() {
        const state = await AppStorage.loadState();
        App.state = state;
        App.applyLanguage();
        App.applyTheme(state.ui.theme);

        const { supabase } = await import('../src/api/client.js');
        const { data: { session } } = await supabase.auth.getSession();
        
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

        if (session) {
            // Check if this email exists in staff table
            const { data: staff } = await supabase.from('staff').select('*').eq('email', session.user.email).single();
            if (staff) {
                const firstName = cleanName(staff.name);
                App.state.currentUser = { 
                    id: staff.username, 
                    name: firstName, 
                    nick: staff.nick, 
                    role: staff.role ? staff.role.toLowerCase() : 'employee',
                    position: staff.position,
                    status: staff.status 
                };
                await AppStorage.saveState(App.state);
                window.location.href = './dashboard.html';
                return;
            } else {
                App.showToast('อีเมลนี้ยังไม่ได้ผูกกับพนักงานในระบบ กรุณาใช้ Username ล็อกอิน');
                await supabase.auth.signOut();
            }
        }

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

        document.getElementById('forgot-password').addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt('กรุณากรอกอีเมลที่ใช้สมัคร เพื่อรับลิงก์รีเซ็ตรหัสผ่าน:');
            if (email) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + window.location.pathname,
                });
                if (error) {
                    App.showToast('เกิดข้อผิดพลาด: ' + error.message);
                } else {
                    App.showToast('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว');
                }
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
            
            
            if (isSignUpMode) {
                // Sign Up Flow
                const emailInput = document.getElementById('email').value.trim();
                if (!emailInput) {
                    App.showToast('กรุณากรอกอีเมลสำหรับการสมัคร');
                    return;
                }
                const { data, error } = await supabase.auth.signUp({
                    email: emailInput,
                    password: password,
                });
                if (error) {
                    console.error('Sign Up Error:', error);
                    App.showToast('ลงทะเบียนล้มเหลว: ' + error.message);
                    return;
                }
                // Save email to staff table
                await supabase.from('staff').update({ email: emailInput }).eq('username', val);
                
                App.showToast('ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบ...');
            } else {
                // Login Flow
                if (!staff.email) {
                    App.showToast('คุณยังไม่ได้ตั้งรหัสผ่าน (กรุณากด Sign Up ก่อน)');
                    return;
                }
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: staff.email,
                    password: password,
                });
                if (error) {
                    console.error('Login Error:', error);
                    App.showToast('รหัสผ่านไม่ถูกต้อง');
                    return;
                }
            }

            // Authentication Success (Login or Signup)
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
