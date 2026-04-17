(function(){
  let state;
  let loggedIn = false;
  let selectedGroup = 'UIR';
  let saveTimer = null;

  function data(){ return state.masterData; }
  function group(){ return data()[selectedGroup]; }

  function escapeHtml(str){
    return String(str)
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'","&#39;");
  }

  function setStaticTexts(){
    document.title = App.t('adminTitle');
    document.getElementById('admin-title').textContent = App.t('adminTitle');
    document.getElementById('admin-subtitle').textContent = App.t('adminSub');
    document.getElementById('admin-group-label').textContent = App.t('targetGroup');
    App.applyLanguage();
  }

  function openLogin(){
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('login-user').value = 'admin';
    document.getElementById('login-pass').value = '';
    setTimeout(() => document.getElementById('login-pass').focus(), 50);
  }
  function closeLogin(){ document.getElementById('login-modal').style.display = 'none'; }

  function updateLoginUI(){
    document.getElementById('login-status').textContent = loggedIn ? App.t('adminOn') : App.t('adminOff');
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

  async function persist(){
    await AppStorage.saveState(state);
    App.showToast(App.t('saved'));
  }

  function scheduleSave(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => { await AppStorage.saveState(state); }, 250);
  }

  function renderTable(){
    if (!loggedIn) return;
    const thead = document.getElementById('admin-thead');
    const tbody = document.getElementById('admin-tbody');

    if (selectedGroup === 'controllers') {
      thead.innerHTML = `
        <tr>
          <th style="width:40px;"></th>
          <th>${App.t('controllerName')}</th>
          <th>${App.t('load')}</th>
          <th>${App.t('price')}</th>
          <th>จัดการ</th>
        </tr>`;
      tbody.innerHTML = data().controllers.map((it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="controller" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}"></td>
          <td><input data-kind="controller" data-field="load" data-index="${idx}" type="number" value="${it.load}"></td>
          <td><input data-kind="controller" data-field="price" data-index="${idx}" type="number" value="${it.price}"></td>
          <td>
            <button class="mini-btn delete" data-action="delete-controller" data-index="${idx}">${App.t('delete')}</button>
          </td>
        </tr>
      `).join('');
    } else if (selectedGroup === 'accessories') {
      thead.innerHTML = `
        <tr>
          <th style="width:40px;"></th>
          <th>ชื่ออุปกรณ์เสริม</th>
          <th>${App.t('price')}</th>
          <th>จัดการ</th>
        </tr>`;
      tbody.innerHTML = (data().accessories || []).map((it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="accessory" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}"></td>
          <td><input data-kind="accessory" data-field="price" data-index="${idx}" type="number" value="${it.price}"></td>
          <td>
            <button class="mini-btn delete" data-action="delete-accessory" data-index="${idx}">${App.t('delete')}</button>
          </td>
        </tr>
      `).join('');
    } else {
      const items = group().items;
      thead.innerHTML = `
        <tr>
          <th style="width:40px;"></th>
          <th>${App.t('name')}</th>
          <th>${App.t('rw')}</th>
          <th>${App.t('rh')}</th>
          <th>${App.t('max')}</th>
          <th>${App.t('avg')}</th>
          <th>${App.t('pricePerCab')}</th>
          <th>จัดการ</th>
        </tr>`;
      tbody.innerHTML = items.map((it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="item" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}"></td>
          <td><input data-kind="item" data-field="rw" data-index="${idx}" type="number" value="${it.rw}"></td>
          <td><input data-kind="item" data-field="rh" data-index="${idx}" type="number" value="${it.rh}"></td>
          <td><input data-kind="item" data-field="max" data-index="${idx}" type="number" value="${it.max}"></td>
          <td><input data-kind="item" data-field="avg" data-index="${idx}" type="number" value="${it.avg}"></td>
          <td><input data-kind="item" data-field="price" data-index="${idx}" type="number" value="${it.price}"></td>
          <td>
            <button class="mini-btn delete" data-action="delete-item" data-index="${idx}">${App.t('delete')}</button>
          </td>
        </tr>
      `).join('');
    }
  }

  function normalizeGroupKey() {
    if (selectedGroup !== 'controllers' && selectedGroup !== 'accessories' && !data()[selectedGroup]) selectedGroup = 'UIR';
  }

  function addRow(){
    if (!loggedIn) return;
    normalizeGroupKey();
    if (selectedGroup === 'controllers') {
      data().controllers.push({ name: 'NEW', load: 1000000, price: 0 });
    } else if (selectedGroup === 'accessories') {
      if (!data().accessories) data().accessories = [];
      data().accessories.push({ name: 'NEW ACCESSORY', price: 0 });
    } else {
      group().items.push({ name: 'NEW MODEL', rw: 0, rh: 0, max: 0, avg: 0, price: 0 });
    }
    renderTable();
    scheduleSave();
  }

  function deleteItem(idx){
    if (!confirm(App.t('confirmDelete'))) return;
    group().items.splice(idx, 1);
    renderTable();
    scheduleSave();
  }

  function deleteController(idx){
    if (!confirm(App.t('confirmDeleteCon'))) return;
    data().controllers.splice(idx, 1);
    renderTable();
    scheduleSave();
  }

  function deleteAccessory(idx){
    if (!confirm(App.t('confirmDelete'))) return;
    if (data().accessories) data().accessories.splice(idx, 1);
    renderTable();
    scheduleSave();
  }

  function handleTableInput(e){
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

  function handleTableAction(e){
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const idx = Number(btn.dataset.index);
    const action = btn.dataset.action;
    if (action === 'delete-item') deleteItem(idx);
    if (action === 'delete-controller') deleteController(idx);
    if (action === 'delete-accessory') deleteAccessory(idx);
  }

  let draggedIndex = null;
  function initDragDrop() {
    const tbody = document.getElementById('admin-tbody');
    
    tbody.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('drag-handle')) {
        const tr = e.target.closest('tr');
        if (tr) tr.setAttribute('draggable', 'true');
      }
    });

    tbody.addEventListener('mouseup', (e) => {
      const tr = e.target.closest('tr');
      if (tr && tr.hasAttribute('draggable')) tr.removeAttribute('draggable');
    });

    tbody.addEventListener('dragstart', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      draggedIndex = Number(tr.dataset.index);
      e.dataTransfer.effectAllowed = 'move';
      tr.style.opacity = '0.6';
    });

    tbody.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const tr = e.target.closest('tr');
      if (tr && Number(tr.dataset.index) !== draggedIndex) {
        tr.style.borderTop = '3px solid var(--primary)';
      }
    });

    tbody.addEventListener('dragleave', (e) => {
      const tr = e.target.closest('tr');
      if (tr) tr.style.borderTop = '';
    });

    tbody.addEventListener('drop', (e) => {
      e.preventDefault();
      const tr = e.target.closest('tr');
      if (!tr) return;
      tr.style.borderTop = '';
      
      const targetIndex = Number(tr.dataset.index);
      if (draggedIndex === null || targetIndex === draggedIndex) return;
      
      const arr = selectedGroup === 'controllers' ? data().controllers : group().items;
      const item = arr.splice(draggedIndex, 1)[0];
      arr.splice(targetIndex, 0, item);
      
      renderTable();
      scheduleSave();
    });

    tbody.addEventListener('dragend', (e) => {
      const tr = e.target.closest('tr');
      if (tr) {
        tr.style.opacity = '1';
        tr.removeAttribute('draggable');
      }
      Array.from(tbody.querySelectorAll('tr')).forEach(r => r.style.borderTop = '');
      draggedIndex = null;
    });
  }

  async function doLogin(){
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (user === 'admin' && pass === '123456') {
      loggedIn = true;
      closeLogin();
      updateLoginUI();
      App.showToast(App.t('loginOk'));
      return;
    }
    alert(App.t('loginFail'));
  }

  async function logout(){
    loggedIn = false;
    updateLoginUI();
  }

  async function saveAll(){
    await persist();
    App.showToast(App.t('saved'));
  }

  async function resetToDefault(){
    if (!confirm(App.t('confirmReset'))) return;
    state.masterData = App.clone(DEFAULT_DATA);
    await AppStorage.saveState(state);
    renderTable();
    App.showToast(App.t('resetDone'));
  }

  async function boot(){
    state = await AppStorage.loadState();
    state.ui = state.ui || { theme: 'light', lang: 'th' };
    state.masterData = state.masterData || App.clone(DEFAULT_DATA);
    if (!state.masterData.accessories) {
      state.masterData.accessories = App.clone(DEFAULT_DATA.accessories);
    }
    App.state = state;
    await AppStorage.saveState(state);

    document.documentElement.setAttribute('data-theme', state.ui.theme || 'light');

    document.getElementById('lang-toggle').addEventListener('click', App.toggleLang);
    document.getElementById('theme-toggle').addEventListener('click', App.toggleTheme);
    document.getElementById('login-btn').addEventListener('click', openLogin);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('login-submit').addEventListener('click', doLogin);
    document.getElementById('admin-save-btn').addEventListener('click', saveAll);
    document.getElementById('admin-reset-btn').addEventListener('click', resetToDefault);
    document.getElementById('admin-add-btn').addEventListener('click', addRow);
    document.getElementById('admin-group').addEventListener('change', (e) => {
      selectedGroup = e.target.value;
      renderTable();
    });

    document.getElementById('admin-tbody').addEventListener('input', handleTableInput);
    document.getElementById('admin-tbody').addEventListener('click', handleTableAction);

    document.getElementById('home-link').href = 'index.html';
    setStaticTexts();
    updateLoginUI();

    const modal = document.getElementById('login-modal');
    window.addEventListener('click', (e) => {
      if (e.target === modal) closeLogin();
    });

    document.getElementById('login-pass').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });

    selectedGroup = 'UIR';
    document.getElementById('admin-group').value = selectedGroup;
    renderTable();
    initDragDrop();
  }

  boot();
})();
