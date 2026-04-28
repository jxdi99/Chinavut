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
    let userRole = (user.role || 'sale').toLowerCase().trim();
    if (userRole === 'developer' || userRole === 'development') userRole = 'dev'; // Map developer/development to dev
    if (userRole === 'owner' || userRole === 'ower') userRole = 'admin'; // Map owner (and typo ower) to admin
    
    // อัปเดตข้อมูลบนหน้าเว็บ
    const nameDisplay = document.getElementById('user-name-display');
    const deptDisplay = document.getElementById('user-dept-display');
    const roleDisplay = document.getElementById('user-role-display');

    if (nameDisplay) nameDisplay.textContent = user.name || user.fullName || user.username || user.id;
    if (deptDisplay) deptDisplay.textContent = user.position || user.role || '-';
    if (roleDisplay) {
      roleDisplay.textContent = userRole.toUpperCase();
      if (userRole === 'dev' || userRole === 'admin') {
        roleDisplay.style.background = '#ef4444'; // Red for admin
      } else if (userRole === 'store') {
        roleDisplay.style.background = '#f59e0b'; // Amber for store
      }
    }

    // เช็คสิทธิ์การมองเห็นเมนูและ Section
    document.querySelectorAll('.role-restricted').forEach(element => {
      const allowedRoles = element.getAttribute('data-allowed').split(',').map(r => r.trim());
      if (allowedRoles.includes(userRole) || userRole === 'dev' || userRole === 'admin') {
        element.classList.remove('role-restricted'); // ลบคลาสที่ซ่อนออก เพื่อให้แสดงผลตามปกติ
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
