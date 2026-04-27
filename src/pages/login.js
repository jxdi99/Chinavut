import { App } from '../core/shared.js'
import { StaffAPI } from '../api/client.js'
import { AppStorage } from '../../storage.js'

(async function () {
    await App.checkAuth();
    App.applyLanguage();

    const loginInput = document.getElementById('employee-id');
    const loginBtn = document.getElementById('login-submit');

    // Auto-formatting logic: hrsp7009 → HR-SP-7-009
    loginInput.addEventListener('input', (e) => {
        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (val.length > 8) val = val.substring(0, 8);
        
        let formatted = val;
        // Format as XX-XX-X-XXX
        if (val.length > 2) formatted = val.substring(0, 2) + '-' + val.substring(2);
        if (val.length > 4) formatted = formatted.substring(0, 5) + '-' + formatted.substring(5);
        if (val.length > 5) formatted = formatted.substring(0, 7) + '-' + formatted.substring(7);
        
        const oldPos = e.target.selectionStart;
        const oldLen = e.target.value.length;
        e.target.value = formatted;
        const newLen = formatted.length;
        e.target.setSelectionRange(oldPos + (newLen - oldLen), oldPos + (newLen - oldLen));
    });

    async function handleLogin() {
        const val = loginInput.value.trim();
        if (!val) return;

        try {
            const staff = await StaffAPI.getByEmpId(val);
            if (staff) {
                // Success
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
                alert(`${App.t('welcome')} คุณ ${firstName}`);
                
                App.state.currentUser = { 
                    id: val, 
                    name: firstName, 
                    nick: staff.nick, 
                    dept: staff.dept,
                    role: 'employee' 
                };
                await AppStorage.saveState(App.state);
                window.location.href = 'index.html';
            } else {
                alert(App.t('invalidId'));
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('Error connecting to system.');
        }
    }

    loginBtn.addEventListener('click', handleLogin);
    loginInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
})();
