/**
 * RAZR LED Solution · detail.js
 * Reads sessionStorage('ledDetail'), renders preview + spec table.
 * Works standalone — no external App/AppStorage dependency required,
 * but falls back to them if available.
 */
(function () {
    'use strict';

    /* ── i18n strings ──────────────────────────────────────────── */
    const I18N = {
        th: {
            technicalSpecTitle: 'รายละเอียดทางเทคนิค',
            screenPanelDetails: 'รายละเอียดหน้าจอและแผง',
            productDetailsHeader: 'รายละเอียดผลิตภัณฑ์',
            displayInfoHeader: 'ข้อมูลการแสดงผล',
            groundLevel: 'ระดับพื้นดิน (GROUND LEVEL)',
            unitMeter: 'เมตร',
            unitPixels: 'Pixel',
            unitHz: 'Hz',
            unitCdSqm: 'cd/m²',
            unitKg: 'Kg.',
            unitWatts: 'W',
            unitSqM: 'm²',
            unitUnits: 'Unit',
            // left col labels
            pixelPitch: 'Pixel Pitch',
            brightness: 'Brightness',
            ledType: 'LED Type',
            cabSize: 'Cabinet Size (WxH)',
            cabRes: 'Cabinet Resolution (WxH)',
            modSize: 'Module Size (WxH)',
            modRes: 'Module Resolution (WxH)',
            refreshRate: 'Refresh Rate',
            material: 'Material',
            maintenance: 'Maintenance',
            cabWeight: 'Cabinet Weight',
            typPower: 'Typical Power (W/m²)',
            maxPower: 'Max Power (W/m²)',
            // right col labels
            panelWidth: 'Panel Width',
            panelHeight: 'Panel Height',
            screenDiag: 'Screen Diagonal',
            cabArray: 'Cabinet Array',
            totalCab: 'Total Cabinets',
            displayRes: 'Display Resolution (WxH)',
            displayResAll: 'Display Resolution (All)',
            pxDensity: 'Pixel Density (pixels/sq.m.)',
            totalWeight: 'LED-Weight',
            totalPower: 'LED Max Power',
            na: 'Authorized Signature: __________________',
            cancel: '← กลับหน้าคำนวณ',
        },
        en: {
            technicalSpecTitle: 'TECHNICAL SPECIFICATION',
            screenPanelDetails: 'Screen and Panel Details',
            productDetailsHeader: 'Product Details',
            displayInfoHeader: 'Display Information',
            groundLevel: 'GROUND LEVEL',
            unitMeter: 'm',
            unitPixels: 'Pixel',
            unitHz: 'Hz',
            unitCdSqm: 'cd/m²',
            unitKg: 'Kg.',
            unitWatts: 'W',
            unitSqM: 'm²',
            unitUnits: 'Unit',
            pixelPitch: 'Pixel Pitch',
            brightness: 'Brightness',
            ledType: 'LED Type',
            cabSize: 'Cabinet Size (WxH)',
            cabRes: 'Cabinet Resolution (WxH)',
            modSize: 'Module Size (WxH)',
            modRes: 'Module Resolution (WxH)',
            refreshRate: 'Refresh Rate',
            material: 'Material',
            maintenance: 'Maintenance',
            cabWeight: 'Cabinet Weight',
            typPower: 'Typical Power (W/m²)',
            maxPower: 'Max Power (W/m²)',
            panelWidth: 'Panel Width',
            panelHeight: 'Panel Height',
            screenDiag: 'Screen Diagonal',
            cabArray: 'Cabinet Array',
            totalCab: 'Total Cabinets',
            displayRes: 'Display Resolution (WxH)',
            displayResAll: 'Display Resolution (All)',
            pxDensity: 'Pixel Density (pixels/sq.m.)',
            totalWeight: 'LED-Weight',
            totalPower: 'LED Max Power',
            na: 'Authorized Signature: __________________',
            cancel: '← Back to Calculator',
        }
    };

    let lang = 'th';
    const t = (key) => (I18N[lang] && I18N[lang][key]) ? I18N[lang][key] : (I18N.en[key] || key);

    /* ── Load data ─────────────────────────────────────────────── */
    const raw = sessionStorage.getItem('ledDetail');
    if (!raw) {
        document.getElementById('pdf-content').innerHTML =
            '<p style="text-align:center;padding:80px;color:#64748b;font-weight:700;">⚠ ไม่พบข้อมูลการคำนวณ — กรุณากลับไปคำนวณก่อน</p>';
        return;
    }

    let d, m;
    try {
        d = JSON.parse(raw);
        m = d.modelData || {};
    } catch (e) {
        console.error('detail.js: bad JSON in sessionStorage', e);
        return;
    }

    /* ── Helpers ───────────────────────────────────────────────── */
    function fmt(val, dec) {
        if (val === null || val === undefined || val === '' || val === '?') return '?';
        if (typeof val === 'number') {
            return dec !== undefined
                ? val.toFixed(dec)
                : val.toLocaleString(undefined, { maximumFractionDigits: 3 });
        }
        return String(val);
    }

    function px(n) { return n + 'px'; }

    /* ── Preview visual ────────────────────────────────────────── */
    function renderPreview() {
        const FLOOR_LIFT = 0.7;   // metres
        const HUMAN_M = 1.6;
        const GAP_M = 1.0;
        const GROUND_PX = 30;     // px from bottom of preview-section

        const section = document.getElementById('preview-section');
        const sectionH = section.clientHeight || 210;
        const sectionW = section.clientWidth || 560;

        const screenW = d.screenW || 6.4;
        const screenH = d.screenH || 1.92;

        // scale so everything fits
        const usableH = sectionH - GROUND_PX - 20;
        const usableW = sectionW - 60;
        const sceneH = Math.max(HUMAN_M, screenH + FLOOR_LIFT);
        const sceneW = HUMAN_M / 3 + GAP_M + screenW;
        const scale = Math.min(usableW / sceneW, usableH / sceneH, 65); // max 65px/m

        const drawW = screenW * scale;
        const drawH = screenH * scale;
        const liftPx = FLOOR_LIFT * scale;
        const humanH = HUMAN_M * scale;

        const viz = document.getElementById('screen-viz');
        viz.style.width = px(drawW);
        viz.style.height = px(drawH);
        viz.style.bottom = px(GROUND_PX + liftPx);

        // Centre screen horizontally, human to its left
        const humanW = HUMAN_M / 3 * scale;
        const totalW = humanW + GAP_M * scale + drawW;
        const startX = (sectionW - totalW) / 2;

        const scaleWrap = document.getElementById('scale-wrap');
        scaleWrap.style.left = px(startX);
        scaleWrap.style.bottom = px(GROUND_PX);

        const humanSvg = document.getElementById('human-svg');
        humanSvg.style.height = px(humanH);
        humanSvg.style.width = 'auto';

        viz.style.left = px(startX + humanW + GAP_M * scale);

        // Labels
        document.getElementById('dim-w-val').textContent =
            `${screenW.toFixed(2)} ${t('unitMeter')}`;
        document.getElementById('dim-h-val').textContent =
            `${screenH.toFixed(2)} ${t('unitMeter')}`;
        document.getElementById('human-dim-val').textContent =
            `1.6 ${t('unitMeter')}`;
        document.getElementById('overlay-array').textContent =
            `${d.wQty || 0} × ${d.hQty || 0}`;
        document.getElementById('overlay-res').textContent =
            `${d.displayResW || 0} × ${d.displayResH || 0} ${t('unitPixels')}`;

        // Product label
        document.getElementById('label-size').textContent =
            `W ${screenW.toFixed(2)} × H ${screenH.toFixed(2)} ${t('unitMeter')}`;

        const ledType = (d.pixelPitch || 0) < 2.5 ? 'COB' : 'SMD';
        document.getElementById('screen-product-label').innerHTML =
            `LED Indoor ${ledType} · P${d.pixelPitch || '?'} · <strong id="label-size">W ${screenW.toFixed(2)} × H ${screenH.toFixed(2)} ${t('unitMeter')}</strong>`;
    }

    /* ── Spec table ────────────────────────────────────────────── */
    function renderTable() {
        // Resolve module dims
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

        const ledType = (d.pixelPitch || 0) < 2.5 ? 'COB' : 'SMD';

        // Screen diagonal
        const diagM = Math.sqrt(
            Math.pow(d.screenW || 0, 2) + Math.pow(d.screenH || 0, 2)
        ).toFixed(3);

        // Total pixels
        const totalPx = (d.displayResW || 0) * (d.displayResH || 0);

        const LEFT = [
            { l: t('pixelPitch'), v: `P${d.pixelPitch || '?'}`, u: 'mm.' },
            { l: t('brightness'), v: m.brightness || '?', u: t('unitCdSqm'), hi: true },
            { l: t('ledType'), v: `LED Indoor ${ledType}`, u: '', hi: true },
            { l: t('cabSize'), v: `${d.cabinetW || '?'}×${d.cabinetH || '?'}`, u: 'mm.', hi: true },
            { l: t('cabRes'), v: `${d.resW || '?'}×${d.resH || '?'}`, u: t('unitPixels') },
            { l: t('modSize'), v: modW ? `${modW}×${modH}` : '?', u: 'mm.', hi: true },
            { l: t('modRes'), v: modResW ? `${modResW}×${modResH}` : '?', u: t('unitPixels') },
            { l: t('refreshRate'), v: m.refresh_rate || '?', u: t('unitHz'), hi: true },
            { l: t('material'), v: m.material || '?', u: '', hi: true },
            { l: t('maintenance'), v: m.maintenance || '?', u: '', hi: true },
            { l: t('cabWeight'), v: fmt(d.cabinetWeight), u: t('unitKg') },
            { l: t('typPower'), v: fmt(d.avgW), u: t('unitWatts') },
            { l: t('maxPower'), v: fmt(d.maxW), u: t('unitWatts') },
        ];

        const RIGHT = [
            { l: t('panelWidth'), v: fmt(d.screenW, 2), u: t('unitMeter') },
            { l: t('panelHeight'), v: fmt(d.screenH, 2), u: t('unitMeter') },
            { l: t('screenDiag'), v: diagM, u: t('unitSqM') },
            { l: t('cabArray'), v: `${d.wQty || 0}×${d.hQty || 0}`, u: '', hi: true },
            { l: t('totalCab'), v: fmt(d.totalQty), u: t('unitUnits') },
            { l: t('displayRes'), v: `${d.displayResW || 0}×${d.displayResH || 0}`, u: t('unitPixels') },
            { l: t('displayResAll'), v: fmt(totalPx), u: t('unitPixels') },
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
                <td>${ls.l}</td>
                <td>${lVal}<span class="unit-sfx">${lUnit}</span></td>
                <td>${rs.l}</td>
                <td>${rVal}<span class="unit-sfx">${rUnit}</span></td>
            </tr>`;
        }

        document.getElementById('spec-tbody').innerHTML = html;
    }

    /* ── Static i18n elements ──────────────────────────────────── */
    function applyLang() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            if (val) el.textContent = val;
        });
        // Update btn-back text
        const btnBack = document.querySelector('.btn-back');
        if (btnBack) btnBack.textContent = t('cancel');
    }

    /* ── Full render ───────────────────────────────────────────── */
    function render() {
        applyLang();
        renderTable();
        // Preview uses pixel dims — call after layout paint
        requestAnimationFrame(renderPreview);
    }

    /* ── Language toggle ───────────────────────────────────────── */
    document.getElementById('lang-toggle').addEventListener('click', function (e) {
        const btn = e.target.closest('.lang-btn');
        if (!btn) return;
        const newLang = btn.dataset.lang;
        if (!newLang || newLang === lang) return;
        lang = newLang;
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
        render();
    });

    /* ── Staff info from sessionStorage ───────────────────────── */
    try {
        const stateRaw = sessionStorage.getItem('appState') || sessionStorage.getItem('razrState');
        if (stateRaw) {
            const st = JSON.parse(stateRaw);
            const user = st.currentUser || st.user;
            if (user && user.name) {
                document.getElementById('staff-info').textContent =
                    `Sales Rep: ${user.name}${user.dept ? ' · ' + user.dept : ''}`;
            }
        }
    } catch (_) { }

    /* ── Init ──────────────────────────────────────────────────── */
    render();

})();