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
            // Remove all non-alphanumeric for processing
            let raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
            
            // If it starts with letters, apply the pattern XX-XX-X-XXX
            if (raw.length >= 3 && /^[A-Z]/.test(raw)) {
                let res = '';
                res += raw.substring(0, 2); 
                if (raw.length > 2) res += '-' + raw.substring(2, 4); 
                if (raw.length > 4) res += '-' + raw.substring(4, 5); 
                if (raw.length > 5) res += '-' + raw.substring(5, 8);
                return res;
            }
            return val.toUpperCase();
        }

        input.addEventListener('input', (e) => {
            const originalValue = input.value;
            const formatted = formatId(originalValue);
            
            if (originalValue !== formatted) {
                // Calculate cursor position by counting non-hyphen characters
                const cursor = input.selectionStart;
                const beforeCursor = originalValue.substring(0, cursor).replace(/-/g, '').length;
                
                input.value = formatted;
                
                // Find new cursor position that matches the count of real characters
                let newCursor = 0;
                let realCount = 0;
                while (realCount < beforeCursor && newCursor < formatted.length) {
                    if (formatted[newCursor] !== '-') {
                        realCount++;
                    }
                    newCursor++;
                }
                // Also skip any hyphens immediately following the character we just typed
                while (newCursor < formatted.length && formatted[newCursor] === '-') {
                    newCursor++;
                }
                
                input.setSelectionRange(newCursor, newCursor);
            }
        });

        submitBtn.addEventListener('click', handleLogin);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
