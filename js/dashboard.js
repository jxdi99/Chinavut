(function() {
  function waitForApp() {
    if (typeof App !== 'undefined' && typeof AppStorage !== 'undefined') {
      initDashboard();
    } else {
      setTimeout(waitForApp, 50);
    }
  }

  async function initDashboard() {
    await App.checkAuth();
    const state = await AppStorage.loadState();
    
    // Fix for logout bug: assign state to App.state so App.logout() works
    App.state = state;
    
    if (!state || !state.currentUser) {
      window.location.href = 'index.html';
      return;
    }

    const user = state.currentUser;
    
    // ใช้ Role จากฐานข้อมูลโดยตรง
    let userRole = (user.role || 'sale').toLowerCase();
    
    // อัปเดตข้อมูลบนหน้าเว็บ
    document.getElementById('user-name-display').textContent = user.name || user.id;
    document.getElementById('user-dept-display').textContent = user.position || '-';
    document.getElementById('user-role-display').textContent = userRole.toUpperCase();
    
    if (userRole === 'dev' || userRole === 'admin') {
      document.getElementById('user-role-display').style.background = '#ef4444'; // Red for admin
    } else if (userRole === 'store') {
      document.getElementById('user-role-display').style.background = '#f59e0b'; // Amber for store
    }

    // เช็คสิทธิ์การมองเห็นเมนู
    document.querySelectorAll('.role-restricted').forEach(card => {
      const allowedRoles = card.getAttribute('data-allowed').split(',');
      if (allowedRoles.includes(userRole)) {
        card.style.display = 'flex'; // Show card
      }
    });

    document.documentElement.setAttribute('data-theme', state.ui?.theme || 'light');
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', App.toggleTheme);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', App.logout);
  }

  waitForApp();
})();
