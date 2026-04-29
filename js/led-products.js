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
        if (id === 'section-receive') loadRecentReceive();
        if (id === 'section-ledger') loadLedgerView();
        if (id === 'section-movement') loadMovementView();
    }

    // ── Load inventory from Supabase ──
    async function fetchInventory() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('led_inventory')
            .select('*')
            .eq('category', 'led') // Filter for LED products
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
    async function insertItem(lot, location, cabinet, module, status, notes, model, pixel, spare_module, date_entered, source) {
        const payload = {
            category: 'led', // Explicitly mark as LED
            lot_number: lot,
            location: location || null,
            cabinet: cabinet || 0,
            module: module || 0,
            status: status || 'ดี',
            notes: notes || null,
            received_by: currentUser?.fullName || currentUser?.name || 'ไม่ทราบ',
            created_at: new Date().toISOString()
        };

        if (model !== undefined) payload.model = model;
        if (pixel !== undefined) payload.pixel = pixel;
        if (spare_module !== undefined) payload.spare_module = spare_module;
        if (date_entered !== undefined) payload.date_entered = date_entered;
        if (source !== undefined) payload.source = source;

        const { error } = await supabase.from('led_inventory').insert(payload);
        return error;
    }

    // ── SECTION: รับเข้า ──
    async function handleReceive() {
        const model = document.getElementById('receive-model').value.trim();
        const pixel = document.getElementById('receive-pixel').value.trim();
        const lot = document.getElementById('receive-lot').value.trim();
        const location = document.getElementById('receive-location').value.trim();
        const cabinet = parseInt(document.getElementById('receive-cabinet').value) || 0;
        const module = parseInt(document.getElementById('receive-module').value) || 0;
        const spare = parseInt(document.getElementById('receive-spare').value) || 0;
        const date_entered = document.getElementById('receive-date').value || null;
        const source = document.getElementById('receive-source').value.trim();
        const status = document.getElementById('receive-status').value;
        const notes = document.getElementById('receive-notes').value.trim();

        if (!lot) { App.showToast('กรุณากรอก Lot เต็ม'); return; }

        App.showToast('กำลังบันทึก...');
        const error = await insertItem(lot, location, cabinet, module, status, notes, model, pixel, spare, date_entered, source);

        if (error) {
            console.error('Insert error:', error);
            App.showToast('เกิดข้อผิดพลาด: ' + error.message);
            return;
        }

        App.showToast(`✅ บันทึก Lot ${lot} สำเร็จ!`);

        // Clear form
        document.getElementById('receive-model').value = '';
        document.getElementById('receive-pixel').value = '';
        document.getElementById('receive-lot').value = '';
        document.getElementById('receive-cabinet').value = '';
        document.getElementById('receive-module').value = '';
        document.getElementById('receive-spare').value = '';
        document.getElementById('receive-date').value = '';
        document.getElementById('receive-source').value = '';
        document.getElementById('receive-notes').value = '';
        document.getElementById('receive-status').value = 'ดี';
        document.getElementById('receive-model').focus();

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

    // ── SECTION: Overview ──
    async function loadOverviewView() {
        allInventory = await fetchInventory();
        
        // Stats
        const totalCabinet = allInventory.reduce((s, i) => s + (parseInt(i.cabinet) || 0), 0);
        const totalModule = allInventory.reduce((s, i) => s + (parseInt(i.module) || 0), 0);
        const totalSpare = allInventory.reduce((s, i) => s + (parseInt(i.spare_module) || 0), 0);

        document.getElementById('ov-total-cabinet').textContent = totalCabinet.toLocaleString('th-TH');
        document.getElementById('ov-total-module').textContent = totalModule.toLocaleString('th-TH');
        document.getElementById('ov-total-spare').textContent = totalSpare.toLocaleString('th-TH');

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
                    pixel: item.pixel || '-',
                    cabinet: 0,
                    module: 0,
                    spare: 0,
                    status: 'ดี'
                };
            }
            summary[key].cabinet += parseInt(item.cabinet) || 0;
            summary[key].module += parseInt(item.module) || 0;
            summary[key].spare += parseInt(item.spare_module) || 0;
            if (item.status === 'เสีย') summary[key].status = 'มีของเสีย';
        });

        const rows = Object.values(summary);
        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">ไม่พบข้อมูลสินค้า</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(row => `
            <tr>
                <td><strong>${row.model}</strong></td>
                <td>${row.pixel}</td>
                <td class="text-right">${row.cabinet.toLocaleString()}</td>
                <td class="text-right">${row.module.toLocaleString()}</td>
                <td class="text-right">${row.spare.toLocaleString()}</td>
                <td class="text-center">
                    <span class="badge ${row.status === 'มีของเสีย' ? 'warn' : ''}">${row.status}</span>
                </td>
            </tr>
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

    // ── SECTION: บันทึกการเคลื่อนไหว (Movement) ──
    const TXN_LABELS = {
        book:   { text: 'จองสินค้า',   color: '#f59e0b', emoji: '🟡' },
        borrow: { text: 'ยืมสินค้า',   color: '#3b82f6', emoji: '🔵' },
        sell:   { text: 'ขายสินค้า',   color: '#ef4444', emoji: '🔴' },
        return: { text: 'คืนสินค้า',   color: '#22c55e', emoji: '🟢' },
        cancel: { text: 'ยกเลิกจอง', color: '#6b7280', emoji: '⚪' },
    };

    async function fetchTransactions() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('led_transactions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('Fetch transactions error:', error); return []; }
        return data || [];
    }

    async function loadMovementView() {
        allInventory = await fetchInventory();

        // Populate Model dropdown
        const models = [...new Set(allInventory.map(i => i.model).filter(Boolean))].sort();
        const modelSel = document.getElementById('mov-model');
        const curModel = modelSel.value;
        modelSel.innerHTML = '<option value="">เลือกรุ่น</option>' +
            models.map(m => `<option value="${m}" ${m === curModel ? 'selected' : ''}>${m}</option>`).join('');

        updateMovLotFilter();
        await renderMovementTable();

        // Set today's date by default
        const dateEl = document.getElementById('mov-date');
        if (!dateEl.value) dateEl.value = new Date().toISOString().split('T')[0];
    }

    function updateMovLotFilter() {
        const selectedModel = document.getElementById('mov-model').value;
        const filtered = selectedModel ? allInventory.filter(i => i.model === selectedModel) : allInventory;
        const lots = [...new Set(filtered.map(i => i.lot_number).filter(Boolean))].sort();
        const lotSel = document.getElementById('mov-lot');
        const curLot = lotSel.value;
        lotSel.innerHTML = '<option value="">เลือก Lot</option>' +
            lots.map(l => `<option value="${l}" ${l === curLot ? 'selected' : ''}>${l}</option>`).join('');
    }

    async function handleMovement() {
        const txnType   = document.getElementById('mov-type').value;
        const model     = document.getElementById('mov-model').value;
        const lot       = document.getElementById('mov-lot').value;
        const cabinet   = parseInt(document.getElementById('mov-cabinet').value) || 0;
        const module    = parseInt(document.getElementById('mov-module').value) || 0;
        const txnDate   = document.getElementById('mov-date').value || null;
        const sales     = document.getElementById('mov-salesperson').value.trim();
        const customer  = document.getElementById('mov-customer').value.trim();
        const reference = document.getElementById('mov-reference').value.trim();
        const notes     = document.getElementById('mov-notes').value.trim();

        if (!lot) { App.showToast('กรุณาเลือก Lot'); return; }
        if (cabinet === 0 && module === 0) { App.showToast('กรุณาระบุจำนวน Cabinet หรือ Module'); return; }

        App.showToast('กำลังบันทึก...');
        const { error } = await supabase.from('led_transactions').insert({
            lot_number: lot, model, pixel: null,
            txn_type: txnType,
            cabinet_qty: cabinet, module_qty: module,
            salesperson: sales, customer, reference, notes,
            txn_date: txnDate,
            created_by: currentUser?.fullName || currentUser?.name || 'ไม่ทราบ',
        });

        if (error) { App.showToast('เกิดข้อผิดพลาด: ' + error.message); return; }

        App.showToast(`✅ บันทึก ${TXN_LABELS[txnType].text} Lot ${lot} เรียบร้อย!`);

        // Clear form partially (keep type, model, lot, sales for speed)
        document.getElementById('mov-cabinet').value = '0';
        document.getElementById('mov-module').value = '0';
        document.getElementById('mov-customer').value = '';
        document.getElementById('mov-reference').value = '';
        document.getElementById('mov-notes').value = '';

        await renderMovementTable();
    }

    let allTransactions = [];

    async function renderMovementTable(searchText = '') {
        allTransactions = await fetchTransactions();
        const tbody = document.getElementById('movement-table-body');

        let filtered = allTransactions;
        if (searchText) {
            const q = searchText.toLowerCase();
            filtered = filtered.filter(t =>
                (t.lot_number || '').toLowerCase().includes(q) ||
                (t.customer || '').toLowerCase().includes(q) ||
                (t.salesperson || '').toLowerCase().includes(q) ||
                (t.model || '').toLowerCase().includes(q)
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--muted);">\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(t => {
            const lbl = TXN_LABELS[t.txn_type] || { text: t.txn_type, color: '#888', emoji: '?' };
            const dateStr = t.txn_date ? new Date(t.txn_date).toLocaleDateString('th-TH') : formatDate(t.created_at);
            return `
                <tr>
                    <td><span class="badge" style="background:${lbl.color};color:white;margin-bottom:0;">${lbl.emoji} ${lbl.text}</span></td>
                    <td>${dateStr}</td>
                    <td><strong>${t.model || '-'}</strong><br><small style="color:var(--muted)">${t.lot_number}</small></td>
                    <td class="text-right">${t.cabinet_qty || '-'}</td>
                    <td class="text-right">${t.module_qty || '-'}</td>
                    <td>${t.salesperson || '-'}</td>
                    <td>${t.customer || '-'}</td>
                    <td>${t.reference || '-'}</td>
                    <td>${t.notes || '-'}</td>
                    <td><small>${t.created_by || '-'}</small></td>
                </tr>
            `;
        }).join('');
    }

    // ── SECTION: บัญชีคุมสต๊อก (Ledger) ──
    async function loadLedgerView() {
        allInventory = await fetchInventory();
        
        // Populate Model Filter
        const models = [...new Set(allInventory.map(i => i.model).filter(Boolean))].sort();
        const modelSel = document.getElementById('ledger-filter-model');
        const currentModel = modelSel.value;
        modelSel.innerHTML = '<option value="">-- ทั้งหมด --</option>' + 
            models.map(m => `<option value="${m}" ${m === currentModel ? 'selected' : ''}>${m}</option>`).join('');

        updateLedgerLotFilter();
        renderLedgerTable();
    }

    function updateLedgerLotFilter() {
        const selectedModel = document.getElementById('ledger-filter-model').value;
        const filteredByModel = selectedModel ? allInventory.filter(i => i.model === selectedModel) : allInventory;
        
        const lots = [...new Set(filteredByModel.map(i => i.lot_number).filter(Boolean))].sort();
        const lotSel = document.getElementById('ledger-filter-lot');
        const currentLot = lotSel.value;
        lotSel.innerHTML = '<option value="">-- ทั้งหมด --</option>' + 
            lots.map(l => `<option value="${l}" ${l === currentLot ? 'selected' : ''}>${l}</option>`).join('');
    }

    function renderLedgerTable() {
        const selectedModel = document.getElementById('ledger-filter-model').value;
        const selectedLot = document.getElementById('ledger-filter-lot').value;
        const tbody = document.getElementById('ledger-table-body');

        if (!selectedModel && !selectedLot) {
            tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 40px; color: var(--muted);">กรุณาเลือก Model หรือ Lot เพื่อดูรายละเอียด</td></tr>';
            return;
        }

        let filtered = allInventory;
        if (selectedModel) filtered = filtered.filter(i => i.model === selectedModel);
        if (selectedLot) filtered = filtered.filter(i => i.lot_number === selectedLot);

        // Sort by creation date ascending for ledger flow
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        let balanceCab = 0;
        let balanceMod = 0;

        tbody.innerHTML = filtered.map(item => {
            const cab = parseInt(item.cabinet) || 0;
            const mod = parseInt(item.module) || 0;
            
            // In this simplified version, every entry in led_inventory is a "Receive" (In)
            // unless we add a transaction_type field later. 
            // For now, let's treat them as additions.
            balanceCab += cab;
            balanceMod += mod;

            return `
                <tr>
                    <td><span class="badge" style="background: var(--success); color: white;">รับเข้า</span></td>
                    <td>${formatDate(item.created_at)}</td>
                    <td class="text-right">${cab > 0 ? cab : '-'}</td>
                    <td class="text-right">-</td>
                    <td class="text-right" style="font-weight:bold; color:var(--primary);">${balanceCab}</td>
                    <td class="text-right">${mod > 0 ? mod : '-'}</td>
                    <td class="text-right">-</td>
                    <td class="text-right" style="font-weight:bold; color:var(--primary);">${balanceMod}</td>
                    <td>${item.received_by || '-'}</td>
                    <td>${item.location || '-'}</td>
                    <td>${item.source || '-'}</td>
                    <td>${item.notes || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    function copyLedgerToClipboard() {
        const table = document.getElementById('ledger-table');
        if (!table) return;

        let tsv = '';
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cols = row.querySelectorAll('th, td');
            const rowData = Array.from(cols).map(col => col.innerText.replace(/\n/g, ' ')).join('\t');
            tsv += rowData + '\n';
        });

        navigator.clipboard.writeText(tsv).then(() => {
            App.showToast('✅ คัดลอกตารางสำหรับ Excel เรียบร้อย!');
        }).catch(err => {
            console.error('Copy failed:', err);
            App.showToast('❌ คัดลอกไม่สำเร็จ');
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
        document.getElementById('back-from-overview').addEventListener('click', showMenu);
        document.getElementById('back-from-receive').addEventListener('click', showMenu);
        document.getElementById('back-from-stock').addEventListener('click', showMenu);
        document.getElementById('back-from-manage').addEventListener('click', showMenu);
        document.getElementById('back-from-ledger').addEventListener('click', showMenu);
        document.getElementById('back-from-movement').addEventListener('click', showMenu);

        // Movement
        document.getElementById('mov-submit').addEventListener('click', handleMovement);
        document.getElementById('mov-model').addEventListener('change', updateMovLotFilter);
        document.getElementById('mov-search').addEventListener('input', (e) => renderMovementTable(e.target.value));

        // Ledger Filters
        document.getElementById('ledger-filter-model').addEventListener('change', () => {
            updateLedgerLotFilter();
            renderLedgerTable();
        });
        document.getElementById('ledger-filter-lot').addEventListener('change', renderLedgerTable);
        document.getElementById('ledger-copy-btn').addEventListener('click', copyLedgerToClipboard);

        // Receive form submit
        document.getElementById('receive-submit').addEventListener('click', handleReceive);

        // Auto calculate module from cabinet
        document.getElementById('receive-cabinet').addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || 0;
            if (val > 0) {
                document.getElementById('receive-module').value = val * 6;
            } else {
                document.getElementById('receive-module').value = '';
            }
        });

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
