import { App } from '../core/shared.js'
import { LEDEngine } from '../core/led-engine.js'
import { AppStorage } from '../../storage.js'

(function () {
  let state;
  let activeGroup = 'UIR';
  let manualController = false;
  let calcMode = 'qty';

  function currentData() { return state.masterData; }
  function group() { return currentData()[activeGroup]; }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", "&#39;");
  }

  function optionsHtml(items) {
    return items.map((it, idx) => `<option value="${idx}">${escapeHtml(it.name)}</option>`).join('');
  }

  function initSelects() {
    const ledSel = document.getElementById('led-select');
    ledSel.innerHTML = optionsHtml(group().items || []);

    if (activeGroup === 'UIR') {
      const defaultIdx = group().items.findIndex(it => it.name === 'UIRx 2.5');
      if (defaultIdx !== -1) ledSel.value = defaultIdx;
    }

    const conSel = document.getElementById('con-select');
    conSel.innerHTML = currentData().controllers.map((it, idx) => `<option value="${idx}">${escapeHtml(it.name)} (Cap: ${(it.load / 1000000).toFixed(2)}M px)</option>`).join('');
    conSel.onchange = () => { manualController = true; recalc(); };

    const extraConSel = document.getElementById('extra-con-select');
    extraConSel.innerHTML = `<option value="-1">${App.t('none')}</option>` + 
       currentData().controllers.map((it, idx) => `<option value="${idx}">${escapeHtml(it.name)} (Cap: ${(it.load / 1000000).toFixed(2)}M px)</option>`).join('');
    
    const accSel = document.getElementById('acc-select');
    accSel.innerHTML = `<option value="-1">${App.t('none')}</option>` + 
       (currentData().accessories || []).map((it, idx) => `<option value="${idx}">${escapeHtml(it.name)} (${it.price.toLocaleString()} ${App.t('unitBaht')})</option>`).join('');
  }

  function setTabActive(groupKey) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`[data-group="${groupKey}"]`);
    if (btn) btn.classList.add('active');
  }

  function recalc() {
    const g = group();
    if (!g || !g.items || !g.items.length) return;

    const ledIndex = Number(document.getElementById('led-select').value || 0);
    const led = g.items[ledIndex] || g.items[0];

    let wQty = 0, hQty = 0;

    if (calcMode === 'size') {
      const widthM = parseFloat(document.getElementById('width_m').value) || 0;
      const heightM = parseFloat(document.getElementById('height_m').value) || 0;
      ({ wQty, hQty } = LEDEngine.calculateQtyFromSize(widthM, heightM, g.w, g.h));
    } else {
      const rawW = document.getElementById('w_qty').value;
      const rawH = document.getElementById('h_qty').value;
      wQty = rawW === '' ? 0 : Math.max(0, parseInt(rawW, 10) || 0);
      hQty = rawH === '' ? 0 : Math.max(0, parseInt(rawH, 10) || 0);
    }

    const specs = LEDEngine.calculateFullSpecs(wQty, hQty, led, g);
    
    const recCon = LEDEngine.recommendController(specs.totalPixels, currentData().controllers);
    const conSel = document.getElementById('con-select');
    if (!manualController && recCon) {
        const recIdx = currentData().controllers.findIndex(c => c.name === recCon.name);
        if (recIdx !== -1) conSel.value = recIdx;
    }
    const selectedCon = currentData().controllers[Number(conSel.value || 0)];

    // Installation prices (Indoor specific logic)
    let installPrice = 0;
    let installText = 'N/A';
    if (g.type === 'indoor') {
      const raw = specs.area * 7000;
      if (raw <= 50000) installPrice = 50000;
      else installPrice = 50000 + (Math.ceil((raw - 50000) / 3000) * 3000);
      installText = `${installPrice.toLocaleString()} บาท`;
    } else {
      installText = 'N/A (Outdoor)';
    }

    const extraConIdx = Number(document.getElementById('extra-con-select').value);
    const extraConQty = Number(document.getElementById('extra-con-qty').value) || 0;
    let extraConPrice = 0;
    let extraConHtml = '';
    if (extraConIdx >= 0 && extraConQty > 0) {
      const eCon = currentData().controllers[extraConIdx];
      extraConPrice = eCon.price * extraConQty;
      extraConHtml = `<div class="result-row bg-highlight"><span>${App.t('extraConLabel')} (${escapeHtml(eCon.name)} x${extraConQty})</span><b>${extraConPrice.toLocaleString()} ${App.t('unitBaht')}</b></div>`;
    }

    const accIdx = Number(document.getElementById('acc-select').value);
    const accQty = Number(document.getElementById('acc-qty').value) || 0;
    let accPrice = 0;
    let accHtml = '';
    if (accIdx >= 0 && accQty > 0) {
      const aItem = currentData().accessories[accIdx];
      accPrice = aItem.price * accQty;
      accHtml = `<div class="result-row bg-highlight"><span>${App.t('accLabel')} (${escapeHtml(aItem.name)} x${accQty})</span><b>${accPrice.toLocaleString()} ${App.t('unitBaht')}</b></div>`;
    }

    const prodPrice = specs.totalQty * led.price;
    const total = prodPrice + installPrice + (selectedCon?.price || 0) + extraConPrice + accPrice;

    document.getElementById('recom-badge').textContent = recCon
      ? `${App.t('recommend')} ${recCon.name}`
      : App.t('noEnough');
    document.getElementById('recom-badge').className = 'badge' + (!recCon ? ' warn' : '');

    document.getElementById('result-display').innerHTML = `
      <div class="result-row"><span>${App.t('screenSize')}</span><b>${specs.screenWM.toFixed(2)} x ${specs.screenHM.toFixed(2)} ${App.t('unitMeter')}</b></div>
      <div class="result-row"><span>${App.t('area')}</span><b>${specs.area.toFixed(3)} ${App.t('unitSqM')}</b></div>
      <div class="result-row"><span>${App.t('resolution')}</span><b>${specs.resW} x ${specs.resH} px</b></div>
      <div class="result-row"><span>${App.t('pixels')}</span><b>${specs.totalPixels.toLocaleString()} Pixels</b></div>
      <div class="result-row"><span>${App.t('weight')}</span><b>${specs.weight.toFixed(1)} ${App.t('unitKg')}</b></div>
      <div class="result-row"><span>${App.t('power')}</span><b>${specs.powerAvg.toLocaleString()} / ${specs.powerMax.toLocaleString()} ${App.t('unitWatts')}</b></div>
      <div class="result-row"><span>${App.t('amps')}</span><b>${specs.amps.toFixed(2)} ${App.t('unitAmps')}</b></div>
      <div class="result-row" style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--border);"><span>${App.t('productPrice')}</span><b>${prodPrice > 0 ? prodPrice.toLocaleString() + ' ' + App.t('unitBaht') : App.t('notQuoted')}</b></div>
      <div class="result-row"><span>${App.t('installPrice')}</span><b>${installText}</b></div>
      <div class="result-row"><span>${App.t('controllerPrice')} (${escapeHtml(selectedCon?.name || '-')})</span><b>${selectedCon && selectedCon.price > 0 ? selectedCon.price.toLocaleString() + ' ' + App.t('unitBaht') : App.t('na')}</b></div>
      ${extraConHtml}
      ${accHtml}
      <div class="result-total">${App.t('total')}: ${prodPrice > 0 ? total.toLocaleString() + ' ' + App.t('unitBaht') : App.t('notQuoted2')}</div>
    `;
  }

  async function switchGroup(groupKey) {
    activeGroup = groupKey;
    manualController = false;
    setTabActive(groupKey);
    initSelects();
    recalc();
  }

  async function boot() {
    await App.checkAuth();
    state = App.state;
    
    document.documentElement.setAttribute('data-theme', state.ui.theme || 'light');
    document.body.classList.add('page-fade-in');

    App.renderWelcomeBanner();
    App.applyLanguage();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.style.display = state.currentUser ? 'inline-block' : 'none';
        logoutBtn.addEventListener('click', App.logout);
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchGroup(btn.dataset.group));
    });

    document.getElementById('led-select').addEventListener('change', () => { manualController = false; recalc(); });
    ['w_qty', 'h_qty', 'width_m', 'height_m', 'extra-con-qty', 'acc-qty'].forEach(id => {
        document.getElementById(id).addEventListener('input', recalc);
    });
    ['extra-con-select', 'acc-select'].forEach(id => {
        document.getElementById(id).addEventListener('change', recalc);
    });

    document.getElementById('mode-qty').addEventListener('click', () => {
      calcMode = 'qty';
      document.getElementById('mode-qty').classList.add('active');
      document.getElementById('mode-size').classList.remove('active');
      document.getElementById('input-qty').style.display = 'block';
      document.getElementById('input-size').style.display = 'none';
      recalc();
    });

    document.getElementById('mode-size').addEventListener('click', () => {
      calcMode = 'size';
      document.getElementById('mode-size').classList.add('active');
      document.getElementById('mode-qty').classList.remove('active');
      document.getElementById('input-size').style.display = 'block';
      document.getElementById('input-qty').style.display = 'none';
      recalc();
    });

    await switchGroup('UIR');
  }

  boot();
})();
