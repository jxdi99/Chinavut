(function () {
  let state;
  let activeGroup = 'UIR';
  let manualController = false;
  let calcMode = 'qty';
  let pricingMode = 'standard';

  function currentData() { return state.masterData; }
  function group() { return currentData()[activeGroup]; }

  function optionsHtml(items) {
    return items.map((it, idx) => `<option value="${idx}">${escapeHtml(it.name)}</option>`).join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", "&#39;");
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

  function recommendedControllerIdx(totalPixels) {
    if (totalPixels <= 0) return -1;
    let rec = -1;
    const wantPlaybox = (activeGroup === 'UOS');

    // 1. ค้นหาในหมวดที่ต้องการก่อน (UOS -> Playbox(A), อื่นๆ -> Sender)
    currentData().controllers.forEach((c, idx) => {
      const isPlaybox = c.name.toUpperCase().startsWith('A');
      if (isPlaybox === wantPlaybox && c.load >= totalPixels) {
        if (rec === -1 || c.load < currentData().controllers[rec].load) rec = idx;
      }
    });

    // 2. เผื่อกรณีที่หาในหมวดนั้นไม่เจอ (เช่น Playbox โหลดไม่พอ) ให้หาตัวไหนก็ได้ที่รับไหว
    if (rec === -1) {
      currentData().controllers.forEach((c, idx) => {
        if (c.load >= totalPixels) {
          if (rec === -1 || c.load < currentData().controllers[rec].load) rec = idx;
        }
      });
    }

    return rec;
  }

  function recalc() {
    const g = group();
    if (!g || !g.items || !g.items.length) return;

    const ledIndex = Number(document.getElementById('led-select').value || 0);
    const led = g.items[ledIndex] || g.items[0];

    let wQty = 1;
    let hQty = 1;

    if (calcMode === 'size') {
      const widthM = parseFloat(document.getElementById('width_m').value) || 0;
      const heightM = parseFloat(document.getElementById('height_m').value) || 0;
      wQty = widthM > 0 ? Math.round((widthM * 1000) / g.w) : 0;
      hQty = heightM > 0 ? Math.round((heightM * 1000) / g.h) : 0;
      // ให้ปรับขั้นต่ำเป็น 1 ตู้เสมอเมื่อมีการกรอกค่า
      if (widthM > 0) wQty = Math.max(1, wQty);
      if (heightM > 0) hQty = Math.max(1, hQty);
    } else {
      const rawW = document.getElementById('w_qty').value;
      const rawH = document.getElementById('h_qty').value;
      wQty = rawW === '' ? 0 : Math.max(0, parseInt(rawW, 10) || 0);
      hQty = rawH === '' ? 0 : Math.max(0, parseInt(rawH, 10) || 0);
    }

    const totalQty = wQty * hQty;
    const screenW = (wQty * g.w) / 1000;
    const screenH = (hQty * g.h) / 1000;
    const area = screenW * screenH;
    const resW = wQty * led.rw;
    const resH = hQty * led.rh;
    const totalPixels = resW * resH;

    const recIdx = recommendedControllerIdx(totalPixels);
    const conSel = document.getElementById('con-select');
    if (!manualController) conSel.value = recIdx !== -1 ? recIdx : 0;
    const selectedCon = currentData().controllers[Number(conSel.value || 0)] || currentData().controllers[0];

    let installPrice = 0;
    let installText = 'N/A';
    let prodPrice = 0;

    // Custom cost breakdown fields
    let customSteelPrice = 0, customAlumPrice = 0, customLoadCabPrice = 0;
    let customCablePrice = 0, customDemoPrice = 0, customFoundPrice = 0;
    let customBreakdownHtml = '';

    if (pricingMode === 'custom') {
      const customPriceSqm = parseFloat(document.getElementById('custom-price-sqm').value) || 0;
      const customInstall = parseFloat(document.getElementById('custom-install').value) || 0;
      customSteelPrice = parseFloat(document.getElementById('custom-steel').value) || 0;
      customAlumPrice = parseFloat(document.getElementById('custom-alum').value) || 0;
      customLoadCabPrice = parseFloat(document.getElementById('custom-load-cab').value) || 0;
      customCablePrice = parseFloat(document.getElementById('custom-cable').value) || 0;
      customDemoPrice = parseFloat(document.getElementById('custom-demo').value) || 0;
      customFoundPrice = parseFloat(document.getElementById('custom-foundation').value) || 0;
      
      prodPrice = area * customPriceSqm;
      installPrice = customInstall;
      installText = `${installPrice.toLocaleString()} ${App.t('unitBaht')}`;

      // Build breakdown rows (only show items with value > 0)
      const breakdownItems = [
        { label: App.t('customSteelLabel'), value: customSteelPrice },
        { label: App.t('customAlumLabel'), value: customAlumPrice },
        { label: App.t('customLoadCabLabel'), value: customLoadCabPrice },
        { label: App.t('customCableLabel'), value: customCablePrice },
        { label: App.t('customDemoLabel'), value: customDemoPrice },
        { label: App.t('customFoundLabel'), value: customFoundPrice },
      ];
      customBreakdownHtml = breakdownItems
        .filter(item => item.value > 0)
        .map(item => `<div class="result-row bg-highlight"><span>${escapeHtml(item.label)}</span><b>${item.value.toLocaleString()} ${App.t('unitBaht')}</b></div>`)
        .join('');
    } else {
      prodPrice = area * led.price;
      if (g.type === 'indoor') {
        const raw = area * 7000;
        if (raw <= 50000) installPrice = 50000;
        else installPrice = 50000 + (Math.ceil((raw - 50000) / 3000) * 3000);
        installText = `${installPrice.toLocaleString()} ${App.t('unitBaht')}`;
      } else {
        installText = 'N/A (Outdoor)';
      }
    }

    const customExtrasTotal = customSteelPrice + customAlumPrice + customLoadCabPrice + customCablePrice + customDemoPrice + customFoundPrice;

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

    const total = prodPrice + installPrice + customExtrasTotal + (selectedCon?.price || 0) + extraConPrice + accPrice;

    document.getElementById('recom-badge').textContent = recIdx !== -1
      ? `${App.t('recommend')} ${currentData().controllers[recIdx].name}`
      : App.t('noEnough');
    document.getElementById('recom-badge').className = 'badge' + (recIdx === -1 ? ' warn' : '');

    let ratioText = '';
    if (screenW > 0 && screenH > 0) {
      const ratio = screenW / screenH;
      if (ratio >= 1.77 && ratio <= 1.79) ratioText = App.t('exact16_9');
      else if (ratio >= 1.80 && ratio <= 1.90) ratioText = App.t('wider16_9');
      else if (ratio >= 1.70 && ratio <= 1.76) ratioText = App.t('taller16_9');
      else if (ratio >= 1.59 && ratio <= 1.61) ratioText = App.t('exact16_10');
      else if (ratio >= 1.62 && ratio <= 1.69) ratioText = App.t('wider16_10');
      else if (ratio >= 1.50 && ratio <= 1.58) ratioText = App.t('taller16_10');
      else if (ratio >= 2.30 && ratio <= 2.36) ratioText = App.t('exact21_9');
      else if (ratio >= 2.37 && ratio <= 2.50) ratioText = App.t('wider21_9');
      else if (ratio >= 2.10 && ratio <= 2.29) ratioText = App.t('taller21_9');
      else ratioText = `${App.t('ratioRaw')} (${ratio.toFixed(2)})`;
    }

    const ratioFeedback = document.getElementById('aspect-ratio-feedback');
    const ratioTextEl = document.getElementById('aspect-ratio-text');
    if (ratioText) {
      ratioTextEl.textContent = ratioText;
      ratioFeedback.style.display = 'block';
    } else {
      ratioFeedback.style.display = 'none';
    }

    const diagonalM = Math.sqrt(screenW * screenW + screenH * screenH);
    const diagonalInch = diagonalM * 39.3701;

    document.getElementById('result-display').innerHTML = `
      <div class="result-row"><span>${App.t('screenSize')}</span><b>${screenW.toFixed(2)} x ${screenH.toFixed(2)} ${App.t('unitMeter')}</b></div>
      <div class="result-row"><span>${App.t('totalCabLabel')}</span><b>${wQty} x ${hQty} = ${totalQty} ${App.t('unitUnits')}</b></div>
      <div class="result-row"><span>${App.t('diagonalLabel')}</span><b>${diagonalInch.toFixed(1)} ${App.t('unitInch')}</b></div>
      ${ratioText ? `<div class="result-row"><span>${App.t('aspectRatio')}</span><b style="color:var(--primary);">${ratioText}</b></div>` : ''}
      <div class="result-row"><span>${App.t('area')}</span><b>${area.toFixed(3)} ${App.t('unitSqM')}</b></div>
      <div class="result-row"><span>${App.t('resolution')}</span><b>${resW} x ${resH} ${App.t('unitPixels')}</b></div>
      <div class="result-row"><span>${App.t('pixels')}</span><b>${totalPixels.toLocaleString()} ${App.t('pixels')}</b></div>
      <div class="result-row"><span>${App.t('weight')}</span><b>${(totalQty * g.weight).toFixed(1)} ${App.t('unitKg')}</b></div>
      <div class="result-row"><span>${App.t('power')}</span><b>${Math.round(area * led.avg).toLocaleString()} / ${Math.round(area * led.max).toLocaleString()} ${App.t('unitWatts')}</b></div>
      <div class="result-row"><span>${App.t('amps')}</span><b>${(area * led.max / 220 * 1.25).toFixed(2)} ${App.t('unitAmps')}</b></div>
      <div class="result-row"><span>${App.t('elecCost')}</span><b>${App.t('perHour')} ${(area * led.max / 1000 * 5).toFixed(2)} ${App.t('unitBaht')}</b></div>
      <div class="result-row" style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--border);"><span>${App.t('productPrice')}</span><b>${prodPrice > 0 ? prodPrice.toLocaleString() + ' ' + App.t('unitBaht') : App.t('notQuoted')}</b></div>
      <div class="result-row"><span>${App.t('installPrice')}</span><b>${installText}</b></div>
      ${customBreakdownHtml}
      <div class="result-row"><span>${App.t('controllerPrice')} (${escapeHtml(selectedCon?.name || '-')})</span><b>${selectedCon && selectedCon.price > 0 ? selectedCon.price.toLocaleString() + ' ' + App.t('unitBaht') : App.t('na')}</b></div>
      ${extraConHtml}
      ${accHtml}
      <div class="result-total">${App.t('total')}: ${prodPrice > 0 ? total.toLocaleString() + ' ' + App.t('unitBaht') : App.t('notQuoted2')}</div>
      <div class="result-note">
        <b>${App.t('calcNoteTitle')}</b> ${App.t('calcNoteDesc')}
      </div>
    `;

    // Save current specs to sessionStorage for Detail page
    const pixelPitch = led.name.match(/[\d.]+$/)?.[0] || '?';
    sessionStorage.setItem('ledDetail', JSON.stringify({
      modelName: led.name,
      modelData: led, // Pass the whole object for advanced specs
      groupKey: activeGroup,
      groupType: g.type,
      pixelPitch,
      cabinetW: g.w,
      cabinetH: g.h,
      cabinetWeight: g.weight,
      resW: led.rw,
      resH: led.rh,
      avgW: led.avg,
      maxW: led.max,
      wQty, hQty, totalQty,
      screenW, screenH, area,
      displayResW: resW,
      displayResH: resH,
      totalPixels,
      totalWeight: (totalQty * g.weight),
      totalPowerMax: Math.round(area * led.max),
      totalPowerAvg: Math.round(area * led.avg),
      totalPowerAvg: Math.round(area * led.avg),
      pixelDensity: area > 0 ? Math.round(totalPixels / area) : 0,
      diagonal: Math.sqrt(screenW * screenW + screenH * screenH)
    }));

    // Final totals
    updateTotalDisplays(totals);
  }

  async function switchGroup(groupKey) {
    activeGroup = groupKey;
    manualController = false;
    setTabActive(groupKey);
    initSelects();
    recalc();
  }

  async function renderHeaderAndText() {
    document.title = App.t('appTitle');
    document.getElementById('app-title').textContent = App.t('appTitle');
    document.getElementById('app-subtitle').textContent = App.t('subtitle');
    
    App.renderWelcomeBanner();
    App.applyLanguage();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = state.currentUser ? 'inline-block' : 'none';
  }

  App.renderAll = function () {
    renderHeaderAndText();
    initSelects();
    recalc();
  };

  async function boot() {
    await App.checkAuth();
    state = await AppStorage.loadState();
    state.ui = state.ui || { theme: 'light', lang: 'th' };
    state.masterData = state.masterData || App.clone(DEFAULT_DATA);
    App.state = state;

    // Load data from DB first
    const syncOk = await App.syncFromDB();
    if (!syncOk) {
      console.warn("Using local cache/default data.");
    }
    
    state.loggedIn = false;
    await AppStorage.saveState(state); // ensure structure exists

    document.documentElement.setAttribute('data-theme', state.ui.theme || 'light');

    document.getElementById('lang-toggle').addEventListener('click', App.handleLangClick);
    document.getElementById('theme-toggle').addEventListener('click', App.toggleTheme);
    const logoutBtn = document.getElementById('logout-btn');
    const priceModeWrapper = document.getElementById('price-mode-wrapper');
    const isLogged = !!state.currentUser;

    if (logoutBtn) logoutBtn.style.display = isLogged ? 'inline-block' : 'none';
    if (priceModeWrapper) priceModeWrapper.style.display = isLogged ? 'inline-flex' : 'none';
    
    if (logoutBtn) logoutBtn.addEventListener('click', App.logout);
    App.renderWelcomeBanner();

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchGroup(btn.dataset.group));
    });

    document.getElementById('led-select').addEventListener('change', () => { manualController = false; recalc(); });
    document.getElementById('w_qty').addEventListener('input', recalc);
    document.getElementById('h_qty').addEventListener('input', recalc);

    document.getElementById('width_m').addEventListener('input', recalc);
    document.getElementById('height_m').addEventListener('input', recalc);

    document.getElementById('extra-con-select').addEventListener('change', recalc);
    document.getElementById('extra-con-qty').addEventListener('input', recalc);
    document.getElementById('acc-select').addEventListener('change', recalc);
    document.getElementById('acc-qty').addEventListener('input', recalc);

    document.getElementById('price-mode-toggle').addEventListener('change', (e) => {
      const isCustom = e.target.checked;
      pricingMode = isCustom ? 'custom' : 'standard';
      document.getElementById('price-mode-label').textContent = isCustom ? 'พนักงาน' : 'มาตรฐาน';
      document.getElementById('input-custom-price').style.display = isCustom ? 'block' : 'none';
      recalc();
    });

    document.getElementById('custom-price-sqm').addEventListener('input', recalc);
    document.getElementById('custom-install').addEventListener('input', recalc);
    document.getElementById('custom-steel').addEventListener('input', recalc);
    document.getElementById('custom-alum').addEventListener('input', recalc);
    document.getElementById('custom-load-cab').addEventListener('input', recalc);
    document.getElementById('custom-cable').addEventListener('input', recalc);
    document.getElementById('custom-demo').addEventListener('input', recalc);
    document.getElementById('custom-foundation').addEventListener('input', recalc);

    function snapToSize(elId, useW) {
      document.getElementById(elId).addEventListener('blur', (e) => {
        if (calcMode !== 'size') return;
        const val = parseFloat(e.target.value);
        if (!val || val <= 0) return;
        const g = group();
        const cabSize = useW ? g.w : g.h;
        const qty = Math.max(1, Math.round((val * 1000) / cabSize));
        const snapped = (qty * cabSize) / 1000;
        e.target.value = snapped.toFixed(2);
        recalc();
      });
    }

    snapToSize('width_m', true);
    snapToSize('height_m', false);

    document.getElementById('mode-qty').addEventListener('click', () => {
      // Convert current size values to qty before switching
      if (calcMode === 'size') {
        const g = group();
        const widthM = parseFloat(document.getElementById('width_m').value) || 0;
        const heightM = parseFloat(document.getElementById('height_m').value) || 0;
        if (widthM > 0) document.getElementById('w_qty').value = Math.max(1, Math.round((widthM * 1000) / g.w));
        if (heightM > 0) document.getElementById('h_qty').value = Math.max(1, Math.round((heightM * 1000) / g.h));
      }
      calcMode = 'qty';
      document.getElementById('mode-qty').classList.add('active');
      document.getElementById('mode-size').classList.remove('active');
      document.getElementById('input-qty').style.display = 'block';
      document.getElementById('input-size').style.display = 'none';
      recalc();
    });

    document.getElementById('mode-size').addEventListener('click', () => {
      // Convert current qty values to size before switching
      if (calcMode === 'qty') {
        const g = group();
        const wQty = parseInt(document.getElementById('w_qty').value) || 0;
        const hQty = parseInt(document.getElementById('h_qty').value) || 0;
        if (wQty > 0) document.getElementById('width_m').value = ((wQty * g.w) / 1000).toFixed(2);
        if (hQty > 0) document.getElementById('height_m').value = ((hQty * g.h) / 1000).toFixed(2);
      }
      calcMode = 'size';
      document.getElementById('mode-size').classList.add('active');
      document.getElementById('mode-qty').classList.remove('active');
      document.getElementById('input-size').style.display = 'block';
      document.getElementById('input-qty').style.display = 'none';
      recalc();
    });

    renderHeaderAndText();

    await switchGroup('UIR');

    // keep texts consistent after initial render
    document.getElementById('calc-reset').addEventListener('click', () => {
      document.getElementById('w_qty').value = '';
      document.getElementById('h_qty').value = '';
      document.getElementById('width_m').value = '';
      document.getElementById('height_m').value = '';
      document.getElementById('extra-con-select').value = '-1';
      document.getElementById('extra-con-qty').value = '0';
      document.getElementById('acc-select').value = '-1';
      document.getElementById('acc-qty').value = '0';
      
      // Reset custom fields
      document.getElementById('custom-price-sqm').value = '';
      document.getElementById('custom-install').value = '';
      document.getElementById('custom-steel').value = '';
      document.getElementById('custom-alum').value = '';
      document.getElementById('custom-load-cab').value = '';
      document.getElementById('custom-cable').value = '';
      document.getElementById('custom-demo').value = '';
      document.getElementById('custom-foundation').value = '';

      manualController = false;
      recalc();
      App.showToast('รีเซ็ตข้อมูลเรียบร้อย');
    });

    document.getElementById('detail-btn').addEventListener('click', () => {
      recalc(); // ensure latest data is saved
      window.open('detail.html', '_blank');
    });
  }

  boot();
})();
