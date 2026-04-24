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
            .order('received_at', { ascending: false });
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

    // ── SECTION: รับเข้า ──
    async function handleReceive() {
        const model = document.getElementById('receive-model').value;
        const qty = parseFloat(document.getElementById('receive-qty').value);
        const lot = document.getElementById('receive-lot').value.trim().toUpperCase();
        const notes = document.getElementById('receive-notes').value.trim();

        if (!model) { App.showToast('กรุณาเลือกรุ่นสินค้า'); return; }
        if (!qty || qty <= 0) { App.showToast('กรุณากรอกจำนวนที่ถูกต้อง'); return; }
        if (!lot) { App.showToast('กรุณากรอก Lot Number'); return; }

        App.showToast('กำลังบันทึก...');

        const { error } = await supabase.from('led_inventory').insert({
            model: model,
            quantity: qty,
            lot_number: lot,
            notes: notes || null,
            received_by: currentUser?.name || 'ไม่ทราบ',
            received_at: new Date().toISOString()
        });

        if (error) {
            console.error('Insert error:', error);
            App.showToast('เกิดข้อผิดพลาด: ' + error.message);
            return;
        }

        App.showToast(`✅ บันทึกรับเข้า ${model} x ${qty} lot ${lot} สำเร็จ!`);

        // Clear form
        document.getElementById('receive-model').value = '';
        document.getElementById('receive-qty').value = '';
        document.getElementById('receive-lot').value = '';
        document.getElementById('receive-notes').value = '';

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
                    <div class="recent-item-model">${item.model} x ${item.quantity}</div>
                    <div class="recent-item-detail">
                        Lot: <span class="lot-badge">${item.lot_number}</span>
                        ${item.notes ? ` · ${item.notes}` : ''}
                    </div>
                </div>
                <div class="recent-item-date">
                    ${formatDate(item.received_at)}<br>
                    <small>โดย ${item.received_by || '-'}</small>
                </div>
            </div>
        `).join('');
    }

    // ── SECTION: นับสต๊อก - Quick Add ──
    async function handleStockQuickAdd() {
        const model = document.getElementById('stock-add-model').value;
        const qty = parseFloat(document.getElementById('stock-add-qty').value);
        const lot = document.getElementById('stock-add-lot').value.trim().toUpperCase();
        const notes = document.getElementById('stock-add-notes').value.trim();

        if (!model) { App.showToast('กรุณาเลือกรุ่นสินค้า'); return; }
        if (!qty || qty <= 0) { App.showToast('กรุณากรอกจำนวน'); return; }
        if (!lot) { App.showToast('กรุณากรอก Lot Number'); return; }

        App.showToast('กำลังบันทึก...');

        const { error } = await supabase.from('led_inventory').insert({
            model: model,
            quantity: qty,
            lot_number: lot,
            notes: notes || null,
            received_by: currentUser?.name || 'ไม่ทราบ',
            received_at: new Date().toISOString()
        });

        if (error) {
            console.error('Quick add error:', error);
            App.showToast('เกิดข้อผิดพลาด: ' + error.message);
            return;
        }

        App.showToast(`✅ เพิ่ม ${model} x ${qty} lot ${lot} สำเร็จ!`);

        // Clear form but keep model selection for speed
        document.getElementById('stock-add-qty').value = '';
        document.getElementById('stock-add-lot').value = '';
        document.getElementById('stock-add-notes').value = '';

        // Focus lot field for next item
        document.getElementById('stock-add-qty').focus();

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
        const totalQty = allInventory.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0);
        const uniqueLots = new Set(allInventory.map(i => i.lot_number)).size;
        const uniqueModels = new Set(allInventory.map(i => i.model)).size;

        document.getElementById('stat-total-qty').textContent = totalQty.toLocaleString('th-TH', { maximumFractionDigits: 1 });
        document.getElementById('stat-total-lots').textContent = uniqueLots;
        document.getElementById('stat-total-models').textContent = uniqueModels;
    }

    function renderStockTable(filterModel = '', searchText = '') {
        let filtered = allInventory;
        if (filterModel) filtered = filtered.filter(i => i.model === filterModel);
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
                <td><strong>${item.model}</strong></td>
                <td>${item.quantity}</td>
                <td><span class="lot-badge">${item.lot_number}</span></td>
                <td>${formatDate(item.received_at)}</td>
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

    function renderManageTable(filterModel = '', searchText = '') {
        let filtered = allInventory;
        if (filterModel) filtered = filtered.filter(i => i.model === filterModel);
        if (searchText) {
            const q = searchText.toLowerCase();
            filtered = filtered.filter(i =>
                (i.lot_number || '').toLowerCase().includes(q) ||
                (i.model || '').toLowerCase().includes(q) ||
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
                <td><strong>${item.model}</strong></td>
                <td>${item.quantity}</td>
                <td><span class="lot-badge">${item.lot_number}</span></td>
                <td>${formatDate(item.received_at)}</td>
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

        // Auto uppercase for lot number
        document.getElementById('receive-lot').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        // Stock quick-add form
        document.getElementById('stock-add-submit').addEventListener('click', handleStockQuickAdd);
        document.getElementById('stock-add-lot').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        document.getElementById('stock-add-lot').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('stock-add-submit').click();
        });
        document.getElementById('stock-add-notes').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('stock-add-submit').click();
        });

        // Stock search/filter
        document.getElementById('stock-search').addEventListener('input', () => {
            const search = document.getElementById('stock-search').value;
            const model = document.getElementById('stock-filter-model').value;
            renderStockTable(model, search);
        });
        document.getElementById('stock-filter-model').addEventListener('change', () => {
            const search = document.getElementById('stock-search').value;
            const model = document.getElementById('stock-filter-model').value;
            renderStockTable(model, search);
        });

        // Manage search/filter
        document.getElementById('manage-search').addEventListener('input', () => {
            const search = document.getElementById('manage-search').value;
            const model = document.getElementById('manage-filter-model').value;
            renderManageTable(model, search);
        });
        document.getElementById('manage-filter-model').addEventListener('change', () => {
            const search = document.getElementById('manage-search').value;
            const model = document.getElementById('manage-filter-model').value;
            renderManageTable(model, search);
        });

        // Enter key on receive form
        document.getElementById('receive-lot').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('receive-submit').click();
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
