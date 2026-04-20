(function () {
    const EXAMPLES = ['HR-MK-4-025', 'HR-SP-7-007', 'HR-SP-7-009', 'HR-SP-7-010', 'HR-SV-6-014'];

    async function init() {
        const state = await AppStorage.loadState();
        App.state = state;
        App.applyLanguage();
        App.applyTheme(state.ui.theme);

        const input = document.getElementById('employee-id');
        const submitBtn = document.getElementById('login-submit');

        async function handleLogin() {
            const val = input.value.trim();
            if (EXAMPLES.includes(val)) {
                // Success
                App.showToast(`${App.t('welcome')} ID: ${val}`);

                // Store logged in user in state if needed
                App.state.currentUser = { id: val, role: 'employee' };
                await AppStorage.saveState(App.state);

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                // Failure
                App.showToast(App.t('invalidId'));
            }
        }

        function formatId(val) {
            // Remove all non-alphanumeric
            let clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            let res = '';
            for (let i = 0; i < clean.length; i++) {
                if (i === 2 || i === 4 || i === 5) res += '-';
                res += clean[i];
            }
            return res.substring(0, 13); // Max length XX-XX-X-XXX
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
