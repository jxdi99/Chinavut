(function () {
    const EXAMPLES = ['HR-MK-4-025', 'HR-SP-7-007', 'HR-SP-7-009', 'HR-SP-7-010', 'HR-SV-6-014'];

    async function init() {
        const state = await AppStorage.loadState();
        App.state = state;
        App.applyLanguage();
        App.applyTheme(state.ui.theme);

        const input = document.getElementById('employee-id');
        const submitBtn = document.getElementById('login-submit');
        const badges = document.querySelectorAll('.id-badge');

        badges.forEach(badge => {
            badge.addEventListener('click', () => {
                input.value = badge.dataset.id || badge.textContent;
                input.focus();
            });
        });

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
            return res.substring(0, 13); // Max length HR-XX-X-XXX
        }

        input.addEventListener('input', (e) => {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const formatted = formatId(input.value);
            
            // Only update if changed to avoid cursor jumping issues in some cases
            if (input.value !== formatted) {
                input.value = formatted;
                // Try to maintain cursor position (simple approach)
                input.setSelectionRange(start + (formatted.length > input.value.length ? 1 : 0), end);
            }
        });

        submitBtn.addEventListener('click', handleLogin);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
