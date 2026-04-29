import { supabase } from '../src/api/client.js';

(function () {
    let allProjects = [];
    let allTransactions = [];
    let currentUser = null;

    async function init() {
        await App.checkAuth();
        const state = await AppStorage.loadState();
        App.state = state;
        currentUser = state.currentUser;

        document.documentElement.setAttribute('data-theme', state.ui?.theme || 'light');
        document.getElementById('logout-btn').addEventListener('click', App.logout);

        // Fetch data
        await Promise.all([fetchQueue(), fetchTransactions()]);

        // Tab switching
        document.querySelectorAll('.pipeline-step').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.pipeline-step').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                document.getElementById(`tab-${tab}`).style.display = 'block';
            });
        });
    }

    async function fetchQueue() {
        if (!supabase) return;
        // In this context, projects in 'booking' status are those that need booking or are being booked
        const { data, error } = await supabase
            .from('led_projects')
            .select('*')
            .eq('status', 'booking')
            .order('updated_at', { ascending: false });

        if (error) { console.error(error); return; }
        allProjects = data || [];
        renderQueue();
    }

    async function fetchTransactions() {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('led_transactions')
            .select('*')
            .eq('txn_type', 'book')
            .order('created_at', { ascending: false });

        if (error) { console.error(error); return; }
        allTransactions = data || [];
        renderActive();
        renderHistory();
    }

    function renderQueue() {
        const tbody = document.getElementById('queue-table-body');
        if (allProjects.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted);">ไม่มีโปรเจคในคิวจองสินค้า</td></tr>`;
            return;
        }

        tbody.innerHTML = allProjects.map(p => `
            <tr>
                <td><span style="font-family:monospace;font-weight:700;color:var(--primary);">${p.project_id}</span></td>
                <td><strong>${p.project_name}</strong></td>
                <td>${p.customer_name}</td>
                <td>${p.salesperson || '-'}</td>
                <td><span class="status-badge s-booking">📦 ${p.status}</span></td>
                <td>
                    <a href="booking-report.html?projectId=${p.id}" class="btn btn-primary" style="font-size:0.75rem;padding:6px 10px;">📦 จองสินค้าจากสต๊อก</a>
                </td>
            </tr>
        `).join('');
    }

    function renderActive() {
        const tbody = document.getElementById('active-table-body');
        // Filter for transactions that haven't been 'cancelled' or 'sold' yet
        // For simplicity, we show all 'book' transactions as active if they are recent
        const active = allTransactions.slice(0, 50); // Show last 50 for now
        
        if (active.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted);">ไม่มีรายการจองที่ Active</td></tr>`;
            return;
        }

        tbody.innerHTML = active.map(t => `
            <tr>
                <td>${t.customer || '-'}</td>
                <td><strong>${t.model || '-'}</strong></td>
                <td><span class="lot-badge">${t.lot_number}</span></td>
                <td class="text-right">${t.cabinet_qty || '-'}</td>
                <td class="text-right">${t.module_qty || '-'}</td>
                <td>${t.salesperson || '-'}</td>
                <td>${t.txn_date ? new Date(t.txn_date).toLocaleDateString('th-TH') : '-'}</td>
                <td>
                    <button class="btn btn-secondary" style="font-size:0.7rem;padding:4px 8px;">⚙️ จัดการ</button>
                </td>
            </tr>
        `).join('');
    }

    function renderHistory() {
        const tbody = document.getElementById('history-table-body');
        if (allTransactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted);">ไม่มีประวัติการจอง</td></tr>`;
            return;
        }

        tbody.innerHTML = allTransactions.map(t => `
            <tr>
                <td>${new Date(t.created_at).toLocaleDateString('th-TH')}</td>
                <td style="font-weight:700;">${t.reference || '-'}</td>
                <td>${t.customer || '-'}</td>
                <td>${t.customer || '-'}</td>
                <td>${t.model} (Lot: ${t.lot_number})</td>
                <td>C:${t.cabinet_qty} / M:${t.module_qty}</td>
                <td><span class="status-badge" style="background:#f59e0b;">🟡 จองไว้</span></td>
            </tr>
        `).join('');
    }

    init();
})();
