(function () {
  window.App = window.App || {};
  App.clone = obj => JSON.parse(JSON.stringify(obj));

  App.t = function (key) {
    const lang = App.state?.ui?.lang || 'th';
    return (window.I18N[lang] && window.I18N[lang][key]) || window.I18N.th[key] || key;
  };

  App.applyTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? `${App.t('theme')}: ${App.t('dark')}` : `${App.t('theme')}: ${App.t('light')}`;
  };

  App.applyLanguage = function () {
    const lang = App.state.ui.lang;
    document.documentElement.lang = lang === 'en' ? 'en' : 'th';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = App.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = text;
      else el.textContent = text;
    });
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.textContent = lang === 'th' ? 'TH / EN' : 'EN / TH';
    App.applyTheme(App.state.ui.theme);
  };

  App.setLang = async function (lang) {
    App.state.ui.lang = lang;
    await AppStorage.saveState(App.state);
    App.applyLanguage();
    if (typeof App.renderAll === 'function') App.renderAll();
  };

  App.toggleTheme = async function () {
    App.state.ui.theme = App.state.ui.theme === 'dark' ? 'light' : 'dark';
    await AppStorage.saveState(App.state);
    App.applyTheme(App.state.ui.theme);
  };

  App.toggleLang = async function () {
    const next = App.state.ui.lang === 'th' ? 'en' : 'th';
    await App.setLang(next);
  };

  App.showToast = function (msg) {
    if (window.__toastTimer) clearTimeout(window.__toastTimer);
    let box = document.getElementById('toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast';
      box.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:99999;background:var(--primary);color:#fff;padding:12px 14px;border-radius:12px;box-shadow:var(--shadow);max-width:min(92vw,360px);';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.style.display = 'block';
    window.__toastTimer = setTimeout(() => { box.style.display = 'none'; }, 1800);
  };

  App.checkAuth = async function () {
    if (window.location.pathname.endsWith('login.html')) return;
    const state = await AppStorage.loadState();
    if (!state.currentUser) {
      window.location.href = 'login.html';
    }
  };

  App.logout = async function () {
    App.state.currentUser = null;
    await AppStorage.saveState(App.state);
    window.location.href = 'login.html';
  };

  App.renderWelcomeBanner = function () {
    const container = document.getElementById('welcome-banner-section');
    if (!container) return;

    const u = App.state.currentUser;
    if (u) {
      container.innerHTML = `
        <div class="welcome-banner">
          <div class="welcome-dept">${u.dept} DEPARTMENT</div>
          <div class="welcome-title">${App.t('welcome')} คุณ ${u.name}</div>
        </div>
      `;
    } else {
      container.innerHTML = '';
    }
  };
})();
