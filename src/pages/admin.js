import { App } from '../core/shared.js'
import { AppStorage } from '../../storage.js'

(function () {
  let state;
  let loggedIn = false;
  let selectedGroup = 'UIR';
  let saveTimer = null;

  function data() { return state.masterData; }
  function group() { return data()[selectedGroup]; }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", "&#39;");
  }

  function setStaticTexts() {
    document.title = App.t('adminTitle');
    document.getElementById('admin-title').textContent = App.t('adminTitle');
    document.getElementById('admin-subtitle').textContent = App.t('adminSub');
    document.getElementById('admin-group-label').textContent = App.t('targetGroup');
    App.applyLanguage();
  }

  function openLogin() {
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('login-user').value = 'admin';
    document.getElementById('login-pass').value = '';
    setTimeout(() => document.getElementById('login-pass').focus(), 50);
  }
  function closeLogin() { document.getElementById('login-modal').style.display = 'none'; }

  function updateLoginUI() {
    App.renderWelcomeBanner();
    
    document.getElementById('login-btn').style.display = loggedIn ? 'none' : 'inline-block';
    document.getElementById('logout-btn').style.display = loggedIn ? 'inline-block' : 'none';
    document.getElementById('admin-panel').style.display = loggedIn ? 'block' : 'none';
    document.getElementById('admin-add-btn').style.display = loggedIn ? 'inline-block' : 'none';
    document.getElementById('admin-save-btn').style.display = loggedIn ? 'inline-block' : 'none';
    document.getElementById('admin-reset-btn').style.display = loggedIn ? 'inline-block' : 'inline-block';
    if (loggedIn) {
      document.getElementById('admin-group').value = selectedGroup;
      renderTable();
    }
  }

  async function persist() {
    await AppStorage.saveState(state);
    alert(App.t('saved'));
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => { await AppStorage.saveState(state); }, 250);
  }

  function renderTable() {
    if (!loggedIn) return;
    const adminThead = document.getElementById('admin-thead');
    const adminTbody = document.getElementById('admin-tbody');
    if (!adminThead || !adminTbody) return;

    if (selectedGroup === 'controllers') {
        adminThead.innerHTML = `<tr><th></th><th>${App.t('controllerName')}</th><th>${App.t('load')}</th><th>${App.t('price')}</th><th>${App.t('manage')}</th></tr>`;
        adminTbody.innerHTML = data().controllers.map((it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle">☰</td>
          <td><input data-kind="controller" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}"></td>
          <td><input data-kind="controller" data-field="load" data-index="${idx}" type="number" value="${it.load}"></td>
          <td><input data-kind="controller" data-field="price" data-index="${idx}" type="number" value="${it.price}"></td>
          <td><button class="mini-btn delete" data-action="delete-controller" data-index="${idx}">${App.t('delete')}</button></td>
        </tr>`).join('');
    } else if (selectedGroup === 'accessories') {
        adminThead.innerHTML = `<tr><th></th><th>${App.t('accName')}</th><th>${App.t('price')}</th><th>${App.t('manage')}</th></tr>`;
        adminTbody.innerHTML = (data().accessories || []).map((it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle">☰</td>
          <td><input data-kind="accessory" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}"></td>
          <td><input data-kind="accessory" data-field="price" data-index="${idx}" type="number" value="${it.price}"></td>
          <td><button class="mini-btn delete" data-action="delete-accessory" data-index="${idx}">${App.t('delete')}</button></td>
        </tr>`).join('');
    } else {
        adminThead.innerHTML = `<tr><th></th><th>${App.t('name')}</th><th>${App.t('rw')}</th><th>${App.t('rh')}</th><th>${App.t('max')}</th><th>${App.t('avg')}</th><th>${App.t('pricePerCab')}</th><th>${App.t('manage')}</th></tr>`;
        adminTbody.innerHTML = group().items.map((it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle">☰</td>
          <td><input data-kind="item" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}"></td>
          <td><input data-kind="item" data-field="rw" data-index="${idx}" type="number" value="${it.rw}"></td>
          <td><input data-kind="item" data-field="rh" data-index="${idx}" type="number" value="${it.rh}"></td>
          <td><input data-kind="item" data-field="max" data-index="${idx}" type="number" value="${it.max}"></td>
          <td><input data-kind="item" data-field="avg" data-index="${idx}" type="number" value="${it.avg}"></td>
          <td><input data-kind="item" data-field="price" data-index="${idx}" type="number" value="${it.price}"></td>
          <td><button class="mini-btn delete" data-action="delete-item" data-index="${idx}">${App.t('delete')}</button></td>
        </tr>`).join('');
    }
  }

  function handleTableInput(e) {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    const index = Number(el.dataset.index);
    const field = el.dataset.field;
    const kind = el.dataset.kind;
    if (!field || Number.isNaN(index)) return;

    if (kind === 'item' && group().items[index]) {
      group().items[index][field] = field === 'name' ? el.value : Number(el.value || 0);
    } else if (kind === 'controller' && data().controllers[index]) {
      data().controllers[index][field] = field === 'name' ? el.value : Number(el.value || 0);
    } else if (kind === 'accessory' && data().accessories[index]) {
      data().accessories[index][field] = field === 'name' ? el.value : Number(el.value || 0);
    }
    scheduleSave();
  }

  async function boot() {
    await App.checkAuth();
    state = App.state;
    
    document.documentElement.setAttribute('data-theme', state.ui.theme || 'light');
    document.body.classList.add('page-fade-in');

    document.getElementById('lang-toggle').addEventListener('click', () => { App.state.ui.lang = App.state.ui.lang === 'th' ? 'en' : 'th'; AppStorage.saveState(App.state); App.applyLanguage(); setStaticTexts(); });
    document.getElementById('theme-toggle').addEventListener('click', () => { App.state.ui.theme = App.state.ui.theme === 'light' ? 'dark' : 'light'; AppStorage.saveState(App.state); document.documentElement.setAttribute('data-theme', App.state.ui.theme); });
    
    document.getElementById('login-btn').addEventListener('click', openLogin);
    document.getElementById('login-submit').addEventListener('click', async () => {
        const user = document.getElementById('login-user').value.trim();
        const pass = document.getElementById('login-pass').value;
        if (user === 'admin' && pass === 'CM212224') {
          loggedIn = true;
          closeLogin();
          updateLoginUI();
          alert(App.t('loginOk'));
        } else {
          alert(App.t('loginFail'));
        }
    });

    document.getElementById('admin-save-btn').addEventListener('click', persist);
    document.getElementById('admin-add-btn').addEventListener('click', () => {
        if (selectedGroup === 'controllers') data().controllers.push({ name: 'NEW', load: 1000000, price: 0 });
        else if (selectedGroup === 'accessories') data().accessories.push({ name: 'NEW ACC', price: 0 });
        else group().items.push({ name: 'NEW MODEL', rw: 0, rh: 0, max: 0, avg: 0, price: 0 });
        renderTable();
        scheduleSave();
    });

    document.getElementById('admin-group').addEventListener('change', (e) => {
      selectedGroup = e.target.value;
      renderTable();
    });

    document.getElementById('admin-tbody').addEventListener('input', handleTableInput);

    setStaticTexts();
    updateLoginUI();
  }

  boot();
})();
