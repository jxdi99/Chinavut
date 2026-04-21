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
                    window.location.href = 'calculator.html';
                }, 1000);
            } else {
                // Failure
                App.showToast(App.t('invalidId'));
            }
        }

        function formatId(val) {
            // Only allow alphanumeric and uppercase it, no hyphens
            return val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        }

        input.addEventListener('input', (e) => {
            const originalValue = input.value;
            const cursor = input.selectionStart;
            
            // Count alphanumeric characters before the cursor in the unformatted string
            const charsBeforeCursor = originalValue.substring(0, cursor).replace(/[^a-zA-Z0-9]/g, '').length;
            
            const formatted = formatId(originalValue);
            
            if (originalValue !== formatted) {
                input.value = formatted;
                
                // Calculate new cursor position
                let newCursor = 0;
                let alphanumericCount = 0;
                while (alphanumericCount < charsBeforeCursor && newCursor < formatted.length) {
                    if (/[a-zA-Z0-9]/.test(formatted[newCursor])) {
                        alphanumericCount++;
                    }
                    newCursor++;
                }

                // If we just added a dash automatically, the cursor might need to skip past it
                if (newCursor < formatted.length && formatted[newCursor] === '-') {
                    // But only if the NEXT char is what the user was going to type
                    // Actually, simpler: if the next char is a dash, skip it.
                    // This handles cases like typing "HR" -> "HR-" (cursor at 3)
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
