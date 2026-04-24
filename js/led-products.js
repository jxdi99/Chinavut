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

        if (id === 'section-stock') loadStockView();
        if (id === 'section-manage') loadManageView();
        if (id === 'section-receive') loadRecentReceive();
    }

    // ── Load inventory from Supabase ──
    async function fetchInventory() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('led_inventory')
            .select('*')
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
    async function insertItem(lot, location, cabinet, module, status, notes) {
        const { error } = await supabase.from('led_inventory').insert({
            lot_number: lot,
            location: location || null,
            cabinet: cabinet || 0,
            module: module || 0,
            status: status || 'ดี',
            notes: notes || null,
            received_by: currentUser?.fullName || currentUser?.name || 'ไม่ทราบ',
            created_at: new Date().toISOString()
        });
        return error;
    }

    // ── SECTION: รับเข้า ──
    async function handleReceive() {
        const lot = document.getElementById('receive-lot').value.trim();
        const location = document.getElementById('receive-location').value.trim();
        const cabinet = parseInt(document.getElementById('receive-cabinet').value) || 0;
        const module = parseInt(document.getElementById('receive-module').value) || 0;
        const status = document.getElementById('receive-status').value;
        const notes = document.getElementById('receive-notes').value.trim();

        if (!lot) { App.showToast('กรุณากรอก Lot'); return; }
        if (!location) { App.showToast('กรุณากรอก Location'); return; }
        if (cabinet === 0 && module === 0) { App.showToast('กรุณากรอก Cabinet หรือ Module'); return; }

        App.showToast('กำลังบันทึก...');
        const error = await insertItem(lot, location, cabinet, module, status, notes);

        if (error) {
            console.error('Insert error:', error);
            App.showToast('เกิดข้อผิดพลาด: ' + error.message);
            return;
        }

        App.showToast(`✅ บันทึก Lot ${lot} สำเร็จ!`);

        // Clear form
        document.getElementById('receive-lot').value = '';
        document.getElementById('receive-cabinet').value = '';
        document.getElementById('receive-module').value = '';
        document.getElementById('receive-notes').value = '';
        document.getElementById('receive-status').value = 'ดี';
        document.getElementById('receive-lot').focus();

        loadRecentReceive();
    }

    async function loadRecentReceive() {
        allInventory = await fetchInventory();
        const container = document.getElementById('recent-receive-list');
        const recent = allInventory.slice(0, 10);

        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">ยังไม่มีรายการรับเข้า</div>
                </div>`;
            return;
        }

        container.innerHTML = recent.map(item => `
            <div class="recent-item">
                <div class="recent-item-info">
                    <div class="recent-item-model">Lot <span class="lot-badge">${item.lot_number}</span></div>
                    <div class="recent-item-detail">
                        📍 ${item.location || '-'}
                        ${item.cabinet ? ` · Cabinet: ${item.cabinet}` : ''}
                        ${item.module ? ` · Module: ${item.module}` : ''}
                        ${item.status ? ` · <span class="badge ${item.status === 'เสีย' ? 'warn' : ''}" style="margin-bottom:0; padding:2px 6px;">${item.status}</span>` : ''}
                        ${item.notes ? ` · 📝 ${item.notes}` : ''}
                    </div>
                </div>
                <div class="recent-item-date">
                    ${formatDate(item.created_at)}<br>
                    <small>โดย ${item.received_by || '-'}</small>
                </div>
            </div>
        `).join('');
    }

    // ── SECTION: นับสต๊อก - Quick Add ──
    async function handleStockQuickAdd() {
        const lot = document.getElementById('stock-add-lot').value.trim();
        const location = document.getElementById('stock-add-location').value.trim();
        const cabinet = parseInt(document.getElementById('stock-add-cabinet').value) || 0;
        const module = parseInt(document.getElementById('stock-add-module').value) || 0;
        const status = document.getElementById('stock-add-status').value;
        const notes = document.getElementById('stock-add-notes').value.trim();

        if (!lot) { App.showToast('กรุณากรอก Lot'); return; }
        if (!location) { App.showToast('กรุณากรอก Location'); return; }
        if (cabinet === 0 && module === 0) { App.showToast('กรุณากรอก Cabinet หรือ Module'); return; }

        App.showToast('กำลังบันทึก...');
        const error = await insertItem(lot, location, cabinet, module, status, notes);

        if (error) {
            App.showToast('เกิดข้อผิดพลาด: ' + error.message);
            return;
        }

        App.showToast(`✅ เพิ่ม Lot ${lot} สำเร็จ!`);

        // Clear form but keep location for speed
        document.getElementById('stock-add-lot').value = '';
        document.getElementById('stock-add-cabinet').value = '';
        document.getElementById('stock-add-module').value = '';
        document.getElementById('stock-add-notes').value = '';
        document.getElementById('stock-add-status').value = 'ดี';
        document.getElementById('stock-add-lot').focus();

        // Reload table & stats
        await loadStockView();
    }

    // ── SECTION: นับสต๊อก ──
    async function loadStockView() {
        allInventory = await fetchInventory();
        renderStockStats();
        renderStockTable();
    }

    function renderStockStats() {
        const totalCabinet = allInventory.reduce((s, i) => s + (parseInt(i.cabinet) || 0), 0);
        const totalModule = allInventory.reduce((s, i) => s + (parseInt(i.module) || 0), 0);
        const uniqueLots = new Set(allInventory.map(i => i.lot_number)).size;

        document.getElementById('stat-total-lots').textContent = uniqueLots;
        document.getElementById('stat-total-cabinet').textContent = totalCabinet.toLocaleString('th-TH');
        document.getElementById('stat-total-module').textContent = totalModule.toLocaleString('th-TH');
    }

    function renderStockTable(searchText = '') {
        let filtered = allInventory;
        if (searchText) {
            const q = searchText.toLowerCase();
            filtered = filtered.filter(i =>
                (i.lot_number || '').toLowerCase().includes(q) ||
                (i.location || '').toLowerCase().includes(q) ||
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
                <td><span class="lot-badge">${item.lot_number}</span></td>
                <td>${item.location || '-'}</td>
                <td>${item.cabinet || '-'}</td>
                <td>${item.module || '-'}</td>
                <td><span class="badge ${item.status === 'เสีย' ? 'warn' : ''}" style="margin-bottom:0; padding:2px 6px;">${item.status || 'ดี'}</span></td>
                <td>${formatDate(item.created_at)}</td>
                <td>${item.received_by || '-'}</td>
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
                (i.location || '').toLowerCase().includes(q) ||
                (i.notes || '').toLowerCase().includes(q)
            );
        }

        const tbody = document.getElementById('manage-table-body');
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted);">ไม่พบข้อมูล</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((item, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><span class="lot-badge">${item.lot_number}</span></td>
                <td>${item.location || '-'}</td>
                <td>${item.cabinet || '-'}</td>
                <td>${item.module || '-'}</td>
                <td><span class="badge ${item.status === 'เสีย' ? 'warn' : ''}" style="margin-bottom:0; padding:2px 6px;">${item.status || 'ดี'}</span></td>
                <td>${formatDate(item.created_at)}</td>
                <td>${item.received_by || '-'}</td>
                <td>${item.notes || '-'}</td>
                <td><button class="btn-delete-sm" data-id="${item.id}">🗑️ ลบ</button></td>
            </tr>
        `).join('');

        // Attach delete handlers
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
        // Check auth
        await App.checkAuth();
        const state = await AppStorage.loadState();
        App.state = state;

        if (!state || !state.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        currentUser = state.currentUser;

        // Theme
        document.documentElement.setAttribute('data-theme', state.ui?.theme || 'light');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.addEventListener('click', App.toggleTheme);
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', App.logout);

        // Sub-menu navigation
        document.querySelectorAll('.sub-menu-card').forEach(card => {
            card.addEventListener('click', () => {
                const target = card.getAttribute('data-target');
                if (target) showSection(target);
            });
        });

        // Back buttons
        document.getElementById('back-from-receive').addEventListener('click', showMenu);
        document.getElementById('back-from-stock').addEventListener('click', showMenu);
        document.getElementById('back-from-manage').addEventListener('click', showMenu);

        // Receive form submit
        document.getElementById('receive-submit').addEventListener('click', handleReceive);

        // Enter key on receive form
        document.getElementById('receive-module').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('receive-submit').click();
        });

        // Stock quick-add form
        document.getElementById('stock-add-submit').addEventListener('click', handleStockQuickAdd);
        document.getElementById('stock-add-module').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('stock-add-submit').click();
        });
        document.getElementById('stock-add-cabinet').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('stock-add-module').focus();
        });

        // Stock search
        document.getElementById('stock-search').addEventListener('input', () => {
            const search = document.getElementById('stock-search').value;
            renderStockTable(search);
        });

        // Manage search
        document.getElementById('manage-search').addEventListener('input', () => {
            const search = document.getElementById('manage-search').value;
            renderManageTable(search);
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
