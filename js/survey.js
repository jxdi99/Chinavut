import { supabase } from '../src/api/client.js';

(function () {
    let allProjects = [];
    let allReports = [];
    let currentUser = null;

    async function init() {
        await App.checkAuth();
        const state = await AppStorage.loadState();
        App.state = state;
        currentUser = state.currentUser;

        document.documentElement.setAttribute('data-theme', state.ui?.theme || 'light');
        document.getElementById('theme-toggle').addEventListener('click', App.toggleTheme);
        document.getElementById('logout-btn').addEventListener('click', App.logout);

        // Fetch data
        await Promise.all([fetchQueue(), fetchReports()]);

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
        const { data, error } = await supabase
            .from('led_projects')
            .select('*')
            .eq('status', 'survey')
            .order('updated_at', { ascending: false });

        if (error) { console.error(error); return; }
        allProjects = data || [];
        renderQueue();
    }

    async function fetchReports() {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('project_reports')
            .select(`
                *,
                led_projects (
                    project_name,
                    customer_name
                )
            `)
            .eq('doc_type', 'Survey')
            .order('created_at', { ascending: false });

        if (error) { console.error(error); return; }
        allReports = data || [];
        renderReports();
    }

    function renderQueue() {
        const tbody = document.getElementById('queue-table-body');
        if (allProjects.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted);">ไม่มีโปรเจคในคิวสำรวจ</td></tr>`;
            return;
        }

        tbody.innerHTML = allProjects.map(p => `
            <tr>
                <td><span style="font-family:monospace;font-weight:700;color:var(--primary);">${p.project_id}</span></td>
                <td><strong>${p.project_name}</strong></td>
                <td>${p.customer_name}</td>
                <td>${p.location || '-'}</td>
                <td>${p.salesperson || '-'}</td>
                <td>${new Date(p.updated_at).toLocaleDateString('th-TH')}</td>
                <td>
                    <a href="survey-report.html?projectId=${p.id}" class="btn btn-primary" style="font-size:0.75rem;padding:6px 10px;">📏 เขียนใบสำรวจ</a>
                </td>
            </tr>
        `).join('');
    }

    function renderReports() {
        const tbody = document.getElementById('reports-table-body');
        if (allReports.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted);">ยังไม่มีรายงานการสำรวจ</td></tr>`;
            return;
        }

        tbody.innerHTML = allReports.map(r => `
            <tr>
                <td style="font-weight:700;">${r.doc_no}</td>
                <td>${r.led_projects?.project_name || '-'}</td>
                <td>${r.led_projects?.customer_name || '-'}</td>
                <td>${r.created_by || '-'}</td>
                <td>${new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                <td><small>${r.notes || '-'}</small></td>
                <td>
                    ${r.doc_url ? `<a href="${r.doc_url}" target="_blank" class="btn btn-secondary" style="font-size:0.7rem;padding:4px 8px;">🔗 เปิดไฟล์</a>` : '-'}
                </td>
            </tr>
        `).join('');
    }

    init();
})();
