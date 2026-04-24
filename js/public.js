(function () {
    let state;
    let activeGroup = 'UIR';
    let calcMode = 'qty';

    function currentData() { return state.masterData; }
    function group() { return currentData()[activeGroup]; }

    function escapeHtml(str) {
        return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    }

    function initSelects() {
        const ledSel = document.getElementById('led-select');
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
        const totalPixels = resW * resH;
        
        const pixelPitch = led.name.match(/[\d.]+$/)?.[0] || '?';

        // Render Visualizer
        renderPreview({
            screenW, screenH,
            wQty, hQty,
            displayResW: resW,
            displayResH: resH,
            pixelPitch: pixelPitch
        });
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

        if (screenW === 0 || screenH === 0) {
            document.getElementById('screen-viz').style.display = 'none';
            return;
        } else {
            document.getElementById('screen-viz').style.display = 'block';
        }

        const usableH = sectionH - GROUND_PX - 80;
        const usableW = sectionW - 60;
        const sceneH = Math.max(HUMAN_M, screenH + FLOOR_LIFT);
        const sceneW = HUMAN_M / 3 + GAP_M + screenW;
        const scale = Math.min(usableW / sceneW, usableH / sceneH, 65);

        const drawW = screenW * scale;
        const drawH = screenH * scale;
        const liftPx = FLOOR_LIFT * scale;
        const humanH = HUMAN_M * scale;

        const viz = document.getElementById('screen-viz');
        viz.style.width = drawW + 'px';
        viz.style.height = drawH + 'px';
        viz.style.bottom = (GROUND_PX + liftPx) + 'px';

        const humanW = HUMAN_M / 3 * scale;
        const totalW = humanW + GAP_M * scale + drawW;
        const startX = (sectionW - totalW) / 2;

        const scaleWrap = document.getElementById('scale-wrap');
        scaleWrap.style.left = startX + 'px';
        scaleWrap.style.bottom = GROUND_PX + 'px';

        const humanSvg = document.getElementById('human-svg');
        humanSvg.style.height = humanH + 'px';
        humanSvg.style.width = 'auto';

        viz.style.left = (startX + humanW + GAP_M * scale) + 'px';

        document.getElementById('dim-w-val').textContent = `${screenW.toFixed(2)} ม.`;
        document.getElementById('dim-h-val').textContent = `${screenH.toFixed(2)} ม.`;
        document.getElementById('overlay-array').textContent = `${d.wQty || 0} × ${d.hQty || 0}`;
        document.getElementById('overlay-res').textContent = `${d.displayResW || 0} × ${d.displayResH || 0} Pixels`;

        document.getElementById('label-size').textContent = `W ${screenW.toFixed(2)} × H ${screenH.toFixed(2)} เมตร`;
        
        const ledType = (parseFloat(d.pixelPitch) || 0) < 2.5 ? 'COB' : 'SMD';
        document.getElementById('screen-product-label').innerHTML = `LED Indoor ${ledType} · P${d.pixelPitch} · <strong id="label-size">W ${screenW.toFixed(2)} × H ${screenH.toFixed(2)} เมตร</strong>`;
    }

    async function switchGroup(groupKey) {
        activeGroup = groupKey;
        setTabActive(groupKey);
        initSelects();
        recalc();
    }

    async function boot() {
        state = await AppStorage.loadState();
        state.masterData = state.masterData || App.clone(DEFAULT_DATA);
        App.state = state;

        // Sync from DB to ensure accurate cabinet dimensions
        await App.syncFromDB();
        
        document.documentElement.setAttribute('data-theme', state.ui?.theme || 'light');
        document.getElementById('theme-toggle').addEventListener('click', App.toggleTheme);
        document.getElementById('lang-toggle').addEventListener('click', App.handleLangClick);

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchGroup(btn.dataset.group));
        });

        document.getElementById('led-select').addEventListener('change', recalc);
        document.getElementById('w_qty').addEventListener('input', recalc);
        document.getElementById('h_qty').addEventListener('input', recalc);
        document.getElementById('width_m').addEventListener('input', recalc);
        document.getElementById('height_m').addEventListener('input', recalc);

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
