import { supabase } from '../src/api/client.js';

(function () {
    let allInventory = [];
    let currentUser = null;

    // ── Navigation ──
    function showMenu() {
        document.getElementById('led-main-menu').style.display = 'block';
        document.querySelectorAll('.led-section').forEach(s => s.classList.remove('active'));
    }

    function showSection(id) {
        document.getElementById('led-main-menu').style.display = 'none';
        document.querySelectorAll('.led-section').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');

        if (id === 'section-overview') loadOverviewView();
        if (id === 'section-stock') loadStockView();
        if (id === 'section-manage') loadManageView();
    }

    // ── Load inventory from Supabase ──
    async function fetchInventory() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('led_inventory')
            .select('*')
            .eq('category', 'controller') // Filter for Controller products
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Fetch inventory error:', error);
            return [];
        }
        return data || [];
    }

    // ── Format date ──
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // ── Insert item to DB ──
    async function insertItem(lot, location, status, notes, model, date_entered, source) {
        const payload = {
            category: 'controller',
            lot_number: lot, // Used for Serial Number for controllers
            location: location || null,
            status: status || 'ดี',
            notes: notes || null,
            model: model || null,
            date_entered: date_entered || null,
            source: source || null,
            received_by: currentUser?.fullName || currentUser?.name || 'ไม่ทราบ',
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('led_inventory').insert(payload);
        return error;
    }

    // ── SECTION: Overview ──
    async function loadOverviewView() {
        allInventory = await fetchInventory();
        
        // Stats
        const totalUnits = allInventory.length;
        const readyUnits = allInventory.filter(i => i.status === 'ดี').length;
        const brokenUnits = allInventory.filter(i => i.status === 'เสีย').length;

        document.getElementById('ov-total-units').textContent = totalUnits.toLocaleString('th-TH');
        document.getElementById('ov-ready-units').textContent = readyUnits.toLocaleString('th-TH');
        document.getElementById('ov-broken-units').textContent = brokenUnits.toLocaleString('th-TH');

        renderOverviewTable();
    }

    function renderOverviewTable() {
        const tbody = document.getElementById('overview-table-body');
        
        // Group by Model
        const summary = {};
        allInventory.forEach(item => {
            const key = item.model || 'Unknown';
            if (!summary[key]) {
                summary[key] = {
                    model: key,
                    total: 0,
                    ready: 0,
                    broken: 0,
                    status: 'ดี'
                };
            }
            summary[key].total++;
            if (item.status === 'ดี') summary[key].ready++;
            if (item.status === 'เสีย') summary[key].broken++;
        });

        const rows = Object.values(summary);
        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">ไม่พบข้อมูลสินค้า</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(row => `
            <tr>
                <td><strong>${row.model}</strong></td>
                <td class="text-right">${row.total.toLocaleString()}</td>
                <td class="text-right">${row.ready.toLocaleString()}</td>
                <td class="text-right" style="color:var(--secondary);">${row.broken.toLocaleString()}</td>
                <td class="text-center">
                    <span class="badge ${row.broken > 0 ? 'warn' : ''}">${row.broken > 0 ? 'มีเครื่องเสีย' : 'ปกติ'}</span>
                </td>
            </tr>
        `).join('');
    }

    // ── SECTION: รับเข้า ──
    async function handleReceive() {
        const model = document.getElementById('receive-model').value.trim();
        const sn = document.getElementById('receive-lot').value.trim();
        const location = document.getElementById('receive-location').value.trim();
        const date_entered = document.getElementById('receive-date').value || null;
        const source = document.getElementById('receive-source').value.trim();
        const status = document.getElementById('receive-status').value;
        const notes = document.getElementById('receive-notes').value.trim();

        if (!model) { App.showToast('กรุณากรอกรุ่น'); return; }
        if (!sn) { App.showToast('กรุณากรอก Serial Number'); return; }

        App.showToast('กำลังบันทึก...');
        const error = await insertItem(sn, location, status, notes, model, date_entered, source);

        if (error) {
            App.showToast('เกิดข้อผิดพลาด: ' + error.message);
            return;
        }

        App.showToast(`✅ บันทึก SN ${sn} สำเร็จ!`);

        // Clear form
        document.getElementById('receive-model').value = '';
        document.getElementById('receive-lot').value = '';
        document.getElementById('receive-location').value = '';
        document.getElementById('receive-date').value = '';
        document.getElementById('receive-source').value = '';
        document.getElementById('receive-notes').value = '';
        document.getElementById('receive-status').value = 'ดี';
        document.getElementById('receive-model').focus();
    }

    // ── SECTION: นับสต๊อก ──
    async function loadStockView() {
        allInventory = await fetchInventory();
        renderStockTable();
    }

    function renderStockTable(searchText = '') {
        let filtered = allInventory;
        if (searchText) {
            const q = searchText.toLowerCase();
            filtered = filtered.filter(i =>
                (i.lot_number || '').toLowerCase().includes(q) ||
                (i.model || '').toLowerCase().includes(q) ||
                (i.notes || '').toLowerCase().includes(q)
            );
        }

        const tbody = document.getElementById('stock-table-body');
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted);">ไม่พบข้อมูล</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((item, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${item.model || '-'}</strong></td>
                <td><span class="lot-badge">${item.lot_number}</span></td>
                <td>${item.location || '-'}</td>
                <td><span class="badge ${item.status === 'เสีย' ? 'warn' : ''}" style="margin-bottom:0; padding:2px 6px;">${item.status || 'ดี'}</span></td>
                <td>${formatDate(item.created_at)}</td>
                <td>${item.notes || '-'}</td>
            </tr>
        `).join('');
    }

    // ── SECTION: จัดการ ──
    async function loadManageView() {
        allInventory = await fetchInventory();
        renderManageTable();
    }

    function renderManageTable(searchText = '') {
        let filtered = allInventory;
        if (searchText) {
            const q = searchText.toLowerCase();
            filtered = filtered.filter(i =>
                (i.lot_number || '').toLowerCase().includes(q) ||
                (i.model || '').toLowerCase().includes(q)
            );
        }

        const tbody = document.getElementById('manage-table-body');
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted);">ไม่พบข้อมูล</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((item, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${item.model || '-'}</td>
                <td><span class="lot-badge">${item.lot_number}</span></td>
                <td>${item.location || '-'}</td>
                <td><span class="badge ${item.status === 'เสีย' ? 'warn' : ''}" style="margin-bottom:0; padding:2px 6px;">${item.status || 'ดี'}</span></td>
                <td><button class="btn-delete-sm" data-id="${item.id}">🗑️ ลบ</button></td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.btn-delete-sm').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return;
                const id = btn.getAttribute('data-id');
                const { error } = await supabase.from('led_inventory').delete().eq('id', id);
                if (error) {
                    App.showToast('ลบไม่สำเร็จ: ' + error.message);
                } else {
                    App.showToast('✅ ลบรายการเรียบร้อย');
                    loadManageView();
                }
            });
        });
    }

    // ── Init ──
    async function init() {
        await App.checkAuth();
        const state = await AppStorage.loadState();
        App.state = state;
        if (!state || !state.currentUser) { window.location.href = 'index.html'; return; }
        currentUser = state.currentUser;

        document.documentElement.setAttribute('data-theme', state.ui?.theme || 'light');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.addEventListener('click', App.toggleTheme);
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', App.logout);

        document.querySelectorAll('.sub-menu-card').forEach(card => {
            card.addEventListener('click', () => {
                const target = card.getAttribute('data-target');
                if (target) showSection(target);
            });
        });

        document.getElementById('back-from-overview').addEventListener('click', showMenu);
        document.getElementById('back-from-receive').addEventListener('click', showMenu);
        document.getElementById('back-from-stock').addEventListener('click', showMenu);
        document.getElementById('back-from-manage').addEventListener('click', showMenu);

        document.getElementById('receive-submit').addEventListener('click', handleReceive);

        document.getElementById('stock-search').addEventListener('input', () => {
            renderStockTable(document.getElementById('stock-search').value);
        });
        document.getElementById('manage-search').addEventListener('input', () => {
            renderManageTable(document.getElementById('manage-search').value);
        });
    }

    function waitForApp() {
        if (typeof App !== 'undefined' && typeof AppStorage !== 'undefined') {
            init();
        } else {
            setTimeout(waitForApp, 50);
        }
    }

    waitForApp();
})();
