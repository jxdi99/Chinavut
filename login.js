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

        submitBtn.addEventListener('click', handleLogin);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
