(function () {
    let state;
    let activeGroup = 'UIR';
    let calcMode = 'qty';

    function currentData() { return state.masterData; }
    function group() { return currentData()[activeGroup]; }

    function escapeHtml(str) {
        return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    }

    function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
    }

    function getAspectRatio(w, h) {
        if (!w || !h) return "0:0";
        // Round to 2 decimal places to handle floating point precision
        const ratio = w / h;
        
        // Check for common standard ratios first
        if (Math.abs(ratio - 16/9) < 0.02) return "16:9";
        if (Math.abs(ratio - 4/3) < 0.02) return "4:3";
        if (Math.abs(ratio - 21/9) < 0.02) return "21:9";
        if (Math.abs(ratio - 1) < 0.02) return "1:1";
        if (Math.abs(ratio - 16/10) < 0.02) return "16:10";

        // Otherwise find simplest fraction
        const precision = 100;
        const common = gcd(Math.round(w * precision), Math.round(h * precision));
        return `${Math.round(w * precision) / common}:${Math.round(h * precision) / common}`;
    }

    function initSelects() {
        const ledSel = document.getElementById('led-select');
        if (!ledSel) return;
        ledSel.innerHTML = (group().items || []).map((it, idx) => `<option value="${idx}">${escapeHtml(it.name)}</option>`).join('');

        if (activeGroup === 'UIR') {
            const defaultIdx = group().items.findIndex(it => it.name === 'UIRx 2.5');
            if (defaultIdx !== -1) ledSel.value = defaultIdx;
        }
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

        let wQty = 1;
        let hQty = 1;

        if (calcMode === 'size') {
            const widthM = parseFloat(document.getElementById('width_m').value) || 0;
            const heightM = parseFloat(document.getElementById('height_m').value) || 0;
            wQty = widthM > 0 ? Math.round((widthM * 1000) / g.w) : 0;
            hQty = heightM > 0 ? Math.round((heightM * 1000) / g.h) : 0;
            if (widthM > 0) wQty = Math.max(1, wQty);
            if (heightM > 0) hQty = Math.max(1, hQty);
        } else {
            const rawW = document.getElementById('w_qty').value;
            const rawH = document.getElementById('h_qty').value;
            wQty = rawW === '' ? 0 : Math.max(0, parseInt(rawW, 10) || 0);
            hQty = rawH === '' ? 0 : Math.max(0, parseInt(rawH, 10) || 0);
        }

        const screenW = (wQty * g.w) / 1000;
        const screenH = (hQty * g.h) / 1000;
        const resW = wQty * led.rw;
        const resH = hQty * led.rh;
        
        const pixelPitch = led.name.match(/[\d.]+$/)?.[0] || '?';

        // Render Visualizer
        renderPreview({
            screenW, screenH,
            wQty, hQty,
            displayResW: resW,
            displayResH: resH,
            pixelPitch: pixelPitch
        });

        // Render Spec Table (New)
        renderSpecTable({
            cabinetW: g.w, cabinetH: g.h,
            resW: led.rw, resH: led.rh,
            avgW: led.avg, maxW: led.max,
            pixelPitch: pixelPitch,
            modelData: led,
            wQty, hQty, totalQty,
            screenW, screenH,
            displayResW: resW,
            displayResH: resH
        });
    }

    function renderSpecTable(d) {
        const specSection = document.getElementById('spec-section');
        if (!specSection) return;

        if (!d.wQty || !d.hQty) {
            specSection.style.display = 'none';
            return;
        }
        specSection.style.display = 'block';

        const m = d.modelData || {};
        let modW = m.mod_w, modH = m.mod_h;
        let modResW = m.mod_res_w, modResH = m.mod_res_h;

        if (!modW) {
            if (d.cabinetW === 600) { modW = 300; modH = 168.75; }
            else if (d.cabinetW === 640) { modW = 320; modH = 160; }
            else if (d.cabinetW === 960) { modW = 320; modH = 160; }
        }
        if (!modResW && modW) {
            modResW = Math.round((d.resW || 0) / ((d.cabinetW || 1) / modW));
            modResH = Math.round((d.resH || 0) / ((d.cabinetH || 1) / (modH || 1)));
        }

        const ledType = (parseFloat(d.pixelPitch) || 0) < 2.5 ? 'COB' : 'SMD';
        const diagM = Math.sqrt(Math.pow(d.screenW || 0, 2) + Math.pow(d.screenH || 0, 2)).toFixed(3);
        const totalPx = (d.displayResW || 0) * (d.displayResH || 0);

        const fmt = (v, dec) => {
            if (v === null || v === undefined || v === '' || v === '?') return '?';
            if (typeof v === 'number') return dec !== undefined ? v.toFixed(dec) : v.toLocaleString();
            return v;
        };

        const LEFT = [
            { l: App.t('pixelPitchLabel') || 'Pixel Pitch', v: `P${d.pixelPitch || '?'}`, u: 'mm.' },
            { l: App.t('brightnessLabel') || 'Brightness', v: m.brightness || '?', u: 'cd/m²', hi: true },
            { l: App.t('ledTypeLabel') || 'LED Type', v: `LED Indoor ${ledType}`, u: '', hi: true },
            { l: App.t('cabSizeLabel') || 'Cabinet Size', v: `${d.cabinetW || '?'}×${d.cabinetH || '?'}`, u: 'mm.', hi: true },
            { l: App.t('cabResLabel') || 'Cabinet Resolution', v: `${d.resW || '?'}×${d.resH || '?'}`, u: 'px' },
            { l: App.t('modSizeLabel') || 'Module Size', v: modW ? `${modW}×${modH}` : '?', u: 'mm.', hi: true },
            { l: App.t('modResLabel') || 'Module Resolution', v: modResW ? `${modResW}×${modResH}` : '?', u: 'px' }
        ];

        const RIGHT = [
            { l: App.t('panelWidthLabel') || 'Panel Width', v: fmt(d.screenW, 2), u: 'm.' },
            { l: App.t('panelHeightLabel') || 'Panel Height', v: fmt(d.screenH, 2), u: 'm.' },
            { l: App.t('screenSize') || 'Area', v: fmt(d.screenW * d.screenH, 3), u: 'm²' },
            { l: App.t('totalCabLabel') || 'Total Cabinets', v: fmt(d.wQty * d.hQty), u: 'Units', hi: true },
            { l: App.t('displayResLabel') || 'Resolution', v: `${d.displayResW || 0}×${d.displayResH || 0}`, u: 'px' },
            { l: App.t('totalPixels') || 'Total Pixels', v: fmt(totalPx), u: 'px' }
        ];

        const rows = Math.max(LEFT.length, RIGHT.length);
        let html = '';
        for (let i = 0; i < rows; i++) {
            const ls = LEFT[i] || { l: '', v: '', u: '' };
            const rs = RIGHT[i] || { l: '', v: '', u: '' };
            const hiClass = (ls.hi || rs.hi) ? ' class="highlight-row"' : '';
            const lVal = fmt(ls.v);
            const rVal = fmt(rs.v);
            const lUnit = (lVal && lVal !== '?') ? ls.u : '';
            const rUnit = (rVal && rVal !== '?') ? rs.u : '';

            html += `<tr${hiClass}>
                <td style="font-weight:700; color:var(--text-main);">${ls.l}</td>
                <td style="text-align:right; font-family:monospace; color:var(--engineering-orange);">${lVal} <span style="font-size:0.7rem; color:var(--text-muted);">${lUnit}</span></td>
                <td style="font-weight:700; color:var(--text-main);">${rs.l}</td>
                <td style="text-align:right; font-family:monospace; color:var(--engineering-orange);">${rVal} <span style="font-size:0.7rem; color:var(--text-muted);">${rUnit}</span></td>
            </tr>`;
        }
        document.getElementById('spec-tbody').innerHTML = html;
    }

    function renderPreview(d) {
        const FLOOR_LIFT = 0.7;   // metres
        const HUMAN_M = 1.6;
        const GAP_M = 1.0;
        const GROUND_PX = 30;     // px from bottom of preview-section

        const section = document.getElementById('preview-section');
        const sectionH = section.clientHeight || 400;
        const sectionW = section.clientWidth || 800;

        const screenW = d.screenW || 0;
        const screenH = d.screenH || 0;

        const viz = document.getElementById('screen-viz');
        if (!viz) return;

        if (screenW === 0 || screenH === 0) {
            viz.style.display = 'none';
            return;
        } else {
            viz.style.display = 'flex'; // Changed to flex for centering
        }

        const usableH = sectionH - GROUND_PX - (sectionW < 600 ? 40 : 80);
        const usableW = sectionW - (sectionW < 600 ? 30 : 60);
        const sceneH = Math.max(HUMAN_M, screenH + FLOOR_LIFT);
        const sceneW = (HUMAN_M / 3) + GAP_M + screenW;
        const scale = Math.min(usableW / sceneW, usableH / sceneH, (sectionW < 600 ? 45 : 65));

        const drawW = screenW * scale;
        const drawH = screenH * scale;
        const liftPx = FLOOR_LIFT * scale;
        const humanH = HUMAN_M * scale;

        viz.style.width = drawW + 'px';
        viz.style.height = drawH + 'px';
        viz.style.bottom = (GROUND_PX + liftPx) + 'px';

        const humanW = (HUMAN_M / 3) * scale;
        const totalW = humanW + (GAP_M * scale) + drawW;
        const startX = (sectionW - totalW) / 2;

        const scaleWrap = document.getElementById('scale-wrap');
        if (scaleWrap) {
            scaleWrap.style.left = startX + 'px';
            scaleWrap.style.bottom = GROUND_PX + 'px';
        }

        const humanSvg = document.getElementById('human-svg');
        if (humanSvg) {
            humanSvg.style.height = humanH + 'px';
            humanSvg.style.width = 'auto';
        }

        viz.style.left = (startX + humanW + (GAP_M * scale)) + 'px';

        // Update labels
        const dimWVal = document.getElementById('dim-w-val');
        const dimHVal = document.getElementById('dim-h-val');
        if (dimWVal) dimWVal.textContent = `${screenW.toFixed(2)} ม.`;
        if (dimHVal) dimHVal.textContent = `${screenH.toFixed(2)} ม.`;

        const overlayArray = document.getElementById('overlay-array');
        const overlayRes = document.getElementById('overlay-res');
        if (overlayArray) overlayArray.textContent = `${d.wQty || 0} × ${d.hQty || 0}`;
        if (overlayRes) overlayRes.textContent = `${d.displayResW || 0} × ${d.displayResH || 0} Pixels`;

        // Aspect Ratio & Diagonal
        const ratio = getAspectRatio(screenW, screenH);
        const diagonalInch = (Math.sqrt(screenW * screenW + screenH * screenH) * 39.3701).toFixed(1);
        
        const ratioEl = document.getElementById('overlay-ratio');
        if (ratioEl) ratioEl.textContent = `${ratio} • ${diagonalInch}"`;

        const labelSize = document.getElementById('label-size');
        if (labelSize) labelSize.textContent = `W ${screenW.toFixed(2)} × H ${screenH.toFixed(2)} เมตร`;
        
        const productLabel = document.getElementById('screen-product-label');
        if (productLabel) {
            const ledType = (parseFloat(d.pixelPitch) || 0) < 2.5 ? 'COB' : 'SMD';
            productLabel.innerHTML = `LED Indoor ${ledType} · P${d.pixelPitch} · <strong>W ${screenW.toFixed(2)} × H ${screenH.toFixed(2)} ม.</strong> <span class="label-badge">${ratio}</span>`;
        }
    }

    async function switchGroup(groupKey) {
        activeGroup = groupKey;
        setTabActive(groupKey);
        initSelects();
        recalc();
    }

    async function boot() {
        if (typeof AppStorage === 'undefined') return;
        state = await AppStorage.loadState();
        state.masterData = state.masterData || App.clone(DEFAULT_DATA);
        App.state = state;

        // Sync from DB to ensure accurate cabinet dimensions
        if (typeof App.syncFromDB === 'function') await App.syncFromDB();
        
        document.documentElement.setAttribute('data-theme', state.ui?.theme || 'light');
        
        const themeBtn = document.getElementById('theme-toggle');
        const langBtn = document.getElementById('lang-toggle');
        const ledSel = document.getElementById('led-select');
        const wQty = document.getElementById('w_qty');
        const hQty = document.getElementById('h_qty');
        const widthM = document.getElementById('width_m');
        const heightM = document.getElementById('height_m');

        if (themeBtn) themeBtn.addEventListener('click', App.toggleTheme);
        if (langBtn) langBtn.addEventListener('click', App.handleLangClick);

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchGroup(btn.dataset.group));
        });

        if (ledSel) ledSel.addEventListener('change', recalc);
        if (wQty) wQty.addEventListener('input', recalc);
        if (hQty) hQty.addEventListener('input', recalc);
        if (widthM) widthM.addEventListener('input', recalc);
        if (heightM) heightM.addEventListener('input', recalc);

        function snapToSize(elId, useW) {
            const el = document.getElementById(elId);
            if (!el) return;
            el.addEventListener('blur', (e) => {
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

        const modeQtyBtn = document.getElementById('mode-qty');
        const modeSizeBtn = document.getElementById('mode-size');
        const inputQtyRow = document.getElementById('input-qty');
        const inputSizeRow = document.getElementById('input-size');

        if (modeQtyBtn) {
            modeQtyBtn.addEventListener('click', () => {
                if (calcMode === 'size') {
                    const g = group();
                    const wM = parseFloat(widthM.value) || 0;
                    const hM = parseFloat(heightM.value) || 0;
                    if (wM > 0) wQty.value = Math.max(1, Math.round((wM * 1000) / g.w));
                    if (hM > 0) hQty.value = Math.max(1, Math.round((hM * 1000) / g.h));
                }
                calcMode = 'qty';
                modeQtyBtn.classList.add('active');
                if (modeSizeBtn) modeSizeBtn.classList.remove('active');
                if (inputQtyRow) inputQtyRow.style.display = 'grid';
                if (inputSizeRow) inputSizeRow.style.display = 'none';
                recalc();
            });
        }

        if (modeSizeBtn) {
            modeSizeBtn.addEventListener('click', () => {
                if (calcMode === 'qty') {
                    const g = group();
                    const wQ = parseInt(wQty.value) || 0;
                    const hQ = parseInt(hQty.value) || 0;
                    if (wQ > 0) widthM.value = ((wQ * g.w) / 1000).toFixed(2);
                    if (hQ > 0) heightM.value = ((hQ * g.h) / 1000).toFixed(2);
                }
                calcMode = 'size';
                modeSizeBtn.classList.add('active');
                if (modeQtyBtn) modeQtyBtn.classList.remove('active');
                if (inputSizeRow) inputSizeRow.style.display = 'grid';
                if (inputQtyRow) inputQtyRow.style.display = 'none';
                recalc();
            });
        }
        
        window.addEventListener('resize', recalc);

        await switchGroup('UIR');
    }

    function waitForDeps() {
        if (typeof App !== 'undefined' && typeof AppStorage !== 'undefined') {
            boot();
        } else {
            setTimeout(waitForDeps, 50);
        }
    }

    waitForDeps();
})();
