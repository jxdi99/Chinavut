import { StaffAPI } from '../src/api/client.js';

(function () {
    async function init() {
        const state = await AppStorage.loadState();
        App.state = state;
        App.applyLanguage();
        App.applyTheme(state.ui.theme);

        const input = document.getElementById('employee-id');
        const submitBtn = document.getElementById('login-submit');

        async function handleLogin() {
            const val = input.value.trim();
            if (!val) return;

            App.showToast(App.t('calculating'));
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
                console.log('Login Success:', staff);
                App.showToast(`${App.t('welcome')} คุณ ${firstName}`);
                
                // Store logged in user in state
                App.state.currentUser = { 
                    id: val, 
                    name: firstName, 
                    nick: staff.nick, 
                    dept: staff.dept,
                    role: 'employee' 
                };
                await AppStorage.saveState(App.state);

                setTimeout(() => {
                    // Use ./ to ensure it stays in the subfolder on GitHub Pages
                    window.location.href = './calculator.html';
                }, 1000);
            } else {
                // Failure
                console.warn('Login Failed: Employee ID not found', val);
                App.showToast(App.t('invalidId'));
            }
        }

        function formatId(val) {
            let raw = val.toUpperCase().replace(/-/g, '');
            if (raw.startsWith('HRSP')) {
                let res = '';
                if (raw.length > 0) res += raw.substring(0, 2); // HR
                if (raw.length > 2) res += '-' + raw.substring(2, 4); // SP
                if (raw.length > 4) res += '-' + raw.substring(4, 5); // 7
                if (raw.length > 5) res += '-' + raw.substring(5, 8); // 009
                return res;
            }
            return val.toUpperCase();
        }

        input.addEventListener('input', (e) => {
            const originalValue = input.value;
            const formatted = formatId(originalValue);
            if (originalValue !== formatted) {
                const start = input.selectionStart;
                const end = input.selectionEnd;
                input.value = formatted;
                input.setSelectionRange(start, end);
            }
        });

        submitBtn.addEventListener('click', handleLogin);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
