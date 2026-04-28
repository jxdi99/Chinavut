(function() {
  function waitForApp() {
    if (typeof App !== 'undefined' && typeof AppStorage !== 'undefined') {
      initForecast();
    } else {
      setTimeout(waitForApp, 50);
    }
  }

  async function initForecast() {
    await App.checkAuth();
    const state = await AppStorage.loadState();
    App.state = state;

    if (!state || !state.currentUser) {
      window.location.href = 'index.html';
      return;
    }

    const user = state.currentUser;
    let userRole = (user.role || 'sale').toLowerCase().trim();
    if (userRole === 'developer' || userRole === 'development') userRole = 'dev';
    if (userRole === 'owner' || userRole === 'ower') userRole = 'admin';

    // Check permissions
    const allowedRoles = ['admin', 'dev', 'store'];
    if (!allowedRoles.includes(userRole)) {
      App.showToast('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
      return;
    }

    document.documentElement.setAttribute('data-theme', state.ui?.theme || 'light');
    document.getElementById('user-display').textContent = user.name || user.id;

    // Attach Topbar Events
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', App.toggleTheme);
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', App.logout);

    // Load Mock Data
    loadForecastData();
  }

  function loadForecastData() {
    // Mock Data for Forecast
    const mockProducts = [
      { id: 'LED-IN-P1.8', name: 'Indoor P1.86', cat: 'led', erp: 500, borrow: 20, reserved: 150, broken: 5, in: 200, inDate: '2026-05-10' },
      { id: 'LED-IN-P2.5', name: 'Indoor P2.5', cat: 'led', erp: 300, borrow: 0, reserved: 280, broken: 2, in: 0, inDate: '-' },
      { id: 'LED-OUT-P4', name: 'Outdoor P4', cat: 'led', erp: 150, borrow: 10, reserved: 50, broken: 15, in: 100, inDate: '2026-05-15' },
      { id: 'CTRL-MCTRL300', name: 'MCTRL300', cat: 'controller', erp: 15, borrow: 2, reserved: 5, broken: 1, in: 10, inDate: '2026-05-01' },
      { id: 'CTRL-VX4S', name: 'VX4S', cat: 'controller', erp: 5, borrow: 1, reserved: 4, broken: 0, in: 0, inDate: '-' },
      { id: 'ACC-SENDING', name: 'Sending Card', cat: 'controller', erp: 50, borrow: 5, reserved: 10, broken: 0, in: 20, inDate: '2026-05-20' },
    ];

    let totalErp = 0;
    let totalReady = 0;
    let totalReserved = 0;
    let totalBorrowed = 0;
    let totalBroken = 0;
    let totalIncoming = 0;
    
    let hasAlert = false;

    const tbody = document.getElementById('forecast-tbody');
    tbody.innerHTML = '';

    mockProducts.forEach(p => {
      // Calculation
      const ready = p.erp - p.borrow - p.reserved - p.broken;
      const forecast = ready + p.in;

      // Summary
      totalErp += p.erp;
      totalReady += ready;
      totalReserved += p.reserved;
      totalBorrowed += p.borrow;
      totalBroken += p.broken;
      totalIncoming += p.in;

      // Status logic
      let statusHtml = '<span class="status-badge status-ok">ปกติ</span>';
      if (forecast < 0) {
        statusHtml = '<span class="status-badge status-danger">ของขาด!</span>';
        hasAlert = true;
      } else if (ready <= 10 && ready > 0) {
        statusHtml = '<span class="status-badge status-low">ใกล้หมด</span>';
      } else if (ready <= 0 && p.in > 0) {
        statusHtml = '<span class="status-badge status-low">รอของเข้า</span>';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${p.id}</strong><br><span style="font-size:0.8em; color:var(--muted);">${p.name}</span></td>
        <td>${p.cat === 'led' ? 'LED Display' : 'Controller'}</td>
        <td class="text-right">${p.erp.toLocaleString()}</td>
        <td class="text-right">${p.borrow.toLocaleString()}</td>
        <td class="text-right">${p.reserved.toLocaleString()}</td>
        <td class="text-right" style="color: #ef4444;">${p.broken.toLocaleString()}</td>
        <td class="text-right highlight-col">${ready.toLocaleString()}</td>
        <td class="text-right" style="color: #8b5cf6;">${p.in > 0 ? '+' + p.in.toLocaleString() : '-'}</td>
        <td class="text-right">${p.inDate}</td>
        <td class="text-right forecast-col ${forecast < 0 ? 'status-danger' : ''}">${forecast.toLocaleString()}</td>
        <td class="text-center">${statusHtml}</td>
      `;
      tbody.appendChild(tr);
    });

    // Update Dashboard Widgets
    document.getElementById('val-total-stock').textContent = totalErp.toLocaleString();
    document.getElementById('val-ready-stock').textContent = totalReady.toLocaleString();
    document.getElementById('val-reserved-stock').textContent = totalReserved.toLocaleString();
    document.getElementById('val-borrowed-stock').textContent = totalBorrowed.toLocaleString();
    document.getElementById('val-broken-stock').textContent = totalBroken.toLocaleString();
    document.getElementById('val-incoming-stock').textContent = totalIncoming.toLocaleString();

    if (hasAlert) {
      document.getElementById('low-stock-alert').style.display = 'flex';
    } else {
      document.getElementById('low-stock-alert').style.display = 'none';
    }
  }

  waitForApp();
})();
