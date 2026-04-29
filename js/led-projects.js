import { supabase } from '../src/api/client.js';

(function () {
    let allProjects = [];
    let currentUser = null;
    let activeFilter = 'all';
    let editingId = null; // DB id when editing
    let currentDetailId = null; // DB id currently viewed in detail modal

    const STAGES = ['new','survey','quotation','demo','booking','installation','service','complete','cancelled'];
    const STAGE_LABELS = {
        new:          { label: 'ใหม่',       emoji: '🆕', cls: 's-new' },
        survey:       { label: 'Survey',      emoji: '📏', cls: 's-survey' },
        quotation:    { label: 'เสนอราคา',   emoji: '💰', cls: 's-quotation' },
        demo:         { label: 'Demo',        emoji: '🎥', cls: 's-demo' },
        booking:      { label: 'จองสินค้า',  emoji: '📦', cls: 's-booking' },
        installation: { label: 'ติดตั้ง',    emoji: '🛠️', cls: 's-installation' },
        service:      { label: 'Service',     emoji: '🔧', cls: 's-service' },
        complete:     { label: 'เสร็จสิ้น',  emoji: '✅', cls: 's-complete' },
        cancelled:    { label: 'ยกเลิก',     emoji: '❌', cls: 's-cancelled' },
    };

    // ── Helpers ──
    function fmtDate(d) {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    function fmtMoney(n) {
        if (!n) return '-';
        return Number(n).toLocaleString() + ' ฿';
    }
    function fmtMillions(n) {
        if (!n) return '0';
        return (Number(n) / 1_000_000).toFixed(2);
    }

    // ── Generate Project ID: PRJ-YYMMDD-XXX ──
    function generateProjectId() {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const prefix = `PRJ-${yy}${mm}${dd}-`;
        const todayProjects = allProjects.filter(p => p.project_id.startsWith(prefix));
        const seq = String(todayProjects.length + 1).padStart(3, '0');
        return prefix + seq;
    }

    // ── Fetch ──
    async function fetchProjects() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('led_projects')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('Fetch projects error:', error); return []; }
        return data || [];
    }

    // ── Stats ──
    function renderStats() {
        const total = allProjects.length;
        const active = allProjects.filter(p => !['complete','cancelled'].includes(p.status)).length;
        const complete = allProjects.filter(p => p.status === 'complete').length;
        const totalVal = allProjects.reduce((s, p) => s + (Number(p.est_value) || 0), 0);

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-active').textContent = active;
        document.getElementById('stat-complete').textContent = complete;
        document.getElementById('stat-value').textContent = fmtMillions(totalVal);
    }

    // ── Pipeline Filter ──
    function renderTable(searchText = '') {
        let filtered = allProjects;
        if (activeFilter !== 'all') {
            filtered = filtered.filter(p => p.status === activeFilter);
        }
        if (searchText) {
            const q = searchText.toLowerCase();
            filtered = filtered.filter(p =>
                (p.project_id || '').toLowerCase().includes(q) ||
                (p.project_name || '').toLowerCase().includes(q) ||
                (p.customer_name || '').toLowerCase().includes(q) ||
                (p.salesperson || '').toLowerCase().includes(q)
            );
        }

        const tbody = document.getElementById('project-table-body');
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--muted);">ไม่พบโปรเจค</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(p => {
            const s = STAGE_LABELS[p.status] || { label: p.status, emoji: '?', cls: '' };
            const updated = p.updated_at || p.created_at;
            return `
                <tr data-id="${p.id}">
                    <td><span style="font-family:monospace; font-weight:700; font-size:0.8rem; color:var(--primary);">${p.project_id}</span></td>
                    <td><strong>${p.project_name}</strong></td>
                    <td>${p.customer_name}</td>
                    <td>${p.location || '-'}</td>
                    <td>${p.screen_size || '-'}</td>
                    <td>${p.salesperson || '-'}</td>
                    <td style="text-align:right; font-weight:600;">${p.est_value ? (Number(p.est_value)/1000000).toFixed(2)+'M' : '-'}</td>
                    <td><span class="status-badge ${s.cls}">${s.emoji} ${s.label}</span></td>
                    <td style="font-size:0.8rem; color:var(--muted);">${fmtDate(updated)}</td>
                </tr>
            `;
        }).join('');

        // Row click → detail
        tbody.querySelectorAll('tr[data-id]').forEach(row => {
            row.addEventListener('click', () => openDetail(Number(row.dataset.id)));
        });
    }

    // ── Detail Modal ──
    function openDetail(id) {
        const p = allProjects.find(x => x.id === id);
        if (!p) return;
        currentDetailId = id;

        document.getElementById('detail-id').textContent = p.project_id;
        document.getElementById('detail-name').textContent = p.project_name;
        document.getElementById('detail-customer').textContent = p.customer_name;
        document.getElementById('detail-contact').textContent = p.contact_person || '-';
        document.getElementById('detail-phone').textContent = p.phone || '-';
        document.getElementById('detail-location').textContent = p.location || '-';
        document.getElementById('detail-type').textContent = p.led_type || '-';
        document.getElementById('detail-size').textContent = p.screen_size || '-';
        document.getElementById('detail-sales').textContent = p.salesperson || '-';
        document.getElementById('detail-value').textContent = p.est_value ? fmtMoney(p.est_value) : '-';
        document.getElementById('detail-notes').textContent = p.notes || '-';

        // Pipeline progress (show only stages up to cancelled/complete)
        const mainStages = ['new','survey','quotation','demo','booking','installation','service'];
        const currentIdx = mainStages.indexOf(p.status);
        const isDone = p.status === 'complete';
        const isCancelled = p.status === 'cancelled';

        let pipelineHtml = '';
        mainStages.forEach((s, i) => {
            const sl = STAGE_LABELS[s];
            let dotClass = '';
            if (isDone || i < currentIdx) dotClass = 'done';
            else if (i === currentIdx) dotClass = 'current';

            if (i > 0) {
                const lineClass = (isDone || i <= currentIdx) ? 'done' : '';
                pipelineHtml += `<div class="pp-line ${lineClass}"></div>`;
            }
            pipelineHtml += `
                <div class="pp-step">
                    <div class="pp-dot ${dotClass}">${dotClass === 'done' ? '✓' : sl.emoji}</div>
                    <div class="pp-label">${sl.label}</div>
                </div>
            `;
        });
        document.getElementById('detail-pipeline').innerHTML = pipelineHtml;

        // Quick status buttons
        const btnsContainer = document.getElementById('detail-status-btns');
        btnsContainer.innerHTML = STAGES.map(s => {
            const sl = STAGE_LABELS[s];
            const isCurrent = s === p.status;
            return `
                <button class="btn ${isCurrent ? 'btn-primary' : 'btn-secondary'}" 
                    data-status="${s}" data-proj-id="${p.id}"
                    style="font-size:0.8rem; padding:6px 12px; ${isCurrent ? '' : 'opacity:0.7;'}">
                    ${sl.emoji} ${sl.label}
                </button>
            `;
        }).join('');

        btnsContainer.querySelectorAll('button[data-status]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const newStatus = btn.dataset.status;
                const projId = Number(btn.dataset.projId);
                await updateProjectStatus(projId, newStatus);
            });
        });

        // Edit button
        document.getElementById('detail-edit').onclick = () => {
            closeDetail();
            openEditModal(p.id);
        };

        // Reset report form and fetch reports
        document.getElementById('report-form-container').style.display = 'none';
        fetchAndRenderReports(id);

        document.getElementById('modal-detail').classList.add('open');
    }

    function closeDetail() {
        document.getElementById('modal-detail').classList.remove('open');
    }

    // ── Update Status ──
    async function updateProjectStatus(id, newStatus) {
        const stageTimestampField = {
            survey: 'at_survey', quotation: 'at_quotation', demo: 'at_demo',
            booking: 'at_booking', installation: 'at_installation', service: 'at_service',
            complete: 'at_complete', cancelled: 'at_cancelled',
        };
        const payload = { status: newStatus, updated_at: new Date().toISOString() };
        if (stageTimestampField[newStatus]) {
            payload[stageTimestampField[newStatus]] = new Date().toISOString();
        }

        const { error } = await supabase.from('led_projects').update(payload).eq('id', id);
        if (error) { App.showToast('อัปเดตไม่สำเร็จ: ' + error.message); return; }

        const sl = STAGE_LABELS[newStatus];
        App.showToast(`✅ อัปเดต Pipeline → ${sl.emoji} ${sl.label}`);

        closeDetail();
        allProjects = await fetchProjects();
        renderStats();
        renderTable(document.getElementById('project-search').value);
    }

    // ── Reports / Documents ──
    async function fetchAndRenderReports(projectId) {
        const tbody = document.getElementById('report-table-body');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:10px;">กำลังโหลด...</td></tr>';
        
        if (!supabase) return;
        const { data, error } = await supabase
            .from('project_reports')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Fetch reports error:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;padding:10px;">โหลดข้อมูลไม่สำเร็จ</td></tr>';
            return;
        }

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:10px;">ยังไม่มีเอกสารอ้างอิง</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(r => {
            const typeLabel = {
                'Quotation': 'ใบเสนอราคา',
                'Survey': 'ใบสำรวจหน้างาน',
                'Demo': 'เอกสาร Demo',
                'Installation': 'ใบส่งมอบ/ติดตั้ง',
                'Service': 'ใบ Service',
                'Other': 'อื่นๆ'
            }[r.doc_type] || r.doc_type;
            
            const linkHtml = r.doc_url 
                ? `<a href="${r.doc_url}" target="_blank" style="color:var(--primary);text-decoration:none;font-weight:600;">🔗 เปิดไฟล์</a>` 
                : '<span style="color:var(--muted);">-</span>';

            return `
                <tr>
                    <td style="font-weight:700;">${r.doc_no}</td>
                    <td>${typeLabel}</td>
                    <td>${r.notes || '-'}</td>
                    <td>${linkHtml}</td>
                </tr>
            `;
        }).join('');
    }

    async function saveReport() {
        if (!currentDetailId) return;
        const docNo = document.getElementById('rep-no').value.trim();
        if (!docNo) { App.showToast('กรุณากรอกเลขที่เอกสาร'); return; }

        const payload = {
            project_id: currentDetailId,
            doc_no: docNo,
            doc_type: document.getElementById('rep-type').value,
            doc_url: document.getElementById('rep-url').value.trim() || null,
            notes: document.getElementById('rep-notes').value.trim() || null,
            created_by: currentUser?.fullName || currentUser?.name || 'ไม่ทราบ',
        };

        App.showToast('กำลังบันทึกเอกสาร...');
        const { error } = await supabase.from('project_reports').insert(payload);
        
        if (error) {
            App.showToast('บันทึกไม่สำเร็จ: ' + error.message);
            return;
        }
        
        App.showToast('✅ บันทึกเอกสารเรียบร้อย!');
        document.getElementById('report-form-container').style.display = 'none';
        
        // Clear inputs
        document.getElementById('rep-no').value = '';
        document.getElementById('rep-url').value = '';
        document.getElementById('rep-notes').value = '';
        
        // Refresh table
        fetchAndRenderReports(currentDetailId);
    }

    // ── Create/Edit Modal ──
    function openCreateModal() {
        editingId = null;
        document.getElementById('modal-title').textContent = '➕ สร้างโปรเจคใหม่';
        document.getElementById('edit-project-id').value = '';
        ['proj-name','proj-customer','proj-contact','proj-phone','proj-location','proj-size','proj-sales','proj-notes'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('proj-value').value = '';
        document.getElementById('proj-led-type').value = 'Indoor';
        document.getElementById('proj-status').value = 'new';
        document.getElementById('modal-project').classList.add('open');
        document.getElementById('proj-name').focus();
    }

    function openEditModal(id) {
        const p = allProjects.find(x => x.id === id);
        if (!p) return;
        editingId = id;
        document.getElementById('modal-title').textContent = `✏️ แก้ไข ${p.project_id}`;
        document.getElementById('edit-project-id').value = p.id;
        document.getElementById('proj-name').value = p.project_name || '';
        document.getElementById('proj-customer').value = p.customer_name || '';
        document.getElementById('proj-contact').value = p.contact_person || '';
        document.getElementById('proj-phone').value = p.phone || '';
        document.getElementById('proj-location').value = p.location || '';
        document.getElementById('proj-led-type').value = p.led_type || 'Indoor';
        document.getElementById('proj-size').value = p.screen_size || '';
        document.getElementById('proj-sales').value = p.salesperson || '';
        document.getElementById('proj-value').value = p.est_value || '';
        document.getElementById('proj-status').value = p.status || 'new';
        document.getElementById('proj-notes').value = p.notes || '';
        document.getElementById('modal-project').classList.add('open');
    }

    function closeModal() {
        document.getElementById('modal-project').classList.remove('open');
    }

    async function saveProject() {
        const name     = document.getElementById('proj-name').value.trim();
        const customer = document.getElementById('proj-customer').value.trim();
        if (!name) { App.showToast('กรุณากรอกชื่อโปรเจค'); return; }
        if (!customer) { App.showToast('กรุณากรอกชื่อลูกค้า'); return; }

        const payload = {
            project_name:   name,
            customer_name:  customer,
            contact_person: document.getElementById('proj-contact').value.trim() || null,
            phone:          document.getElementById('proj-phone').value.trim() || null,
            location:       document.getElementById('proj-location').value.trim() || null,
            led_type:       document.getElementById('proj-led-type').value,
            screen_size:    document.getElementById('proj-size').value.trim() || null,
            salesperson:    document.getElementById('proj-sales').value.trim() || null,
            est_value:      parseInt(document.getElementById('proj-value').value) || null,
            status:         document.getElementById('proj-status').value,
            notes:          document.getElementById('proj-notes').value.trim() || null,
            updated_at:     new Date().toISOString(),
        };

        App.showToast('กำลังบันทึก...');

        if (editingId) {
            const { error } = await supabase.from('led_projects').update(payload).eq('id', editingId);
            if (error) { App.showToast('บันทึกไม่สำเร็จ: ' + error.message); return; }
            App.showToast('✅ อัปเดตโปรเจคเรียบร้อย');
        } else {
            payload.project_id = generateProjectId();
            payload.created_by = currentUser?.fullName || currentUser?.name || 'ไม่ทราบ';
            payload.created_at = new Date().toISOString();

            const { error } = await supabase.from('led_projects').insert(payload);
            if (error) { App.showToast('บันทึกไม่สำเร็จ: ' + error.message); return; }
            App.showToast(`✅ สร้างโปรเจค ${payload.project_id} เรียบร้อย!`);
        }

        closeModal();
        allProjects = await fetchProjects();
        renderStats();
        renderTable(document.getElementById('project-search').value);
    }

    // ── Init ──
    async function init() {
        await App.checkAuth();
        const state = await AppStorage.loadState();
        App.state = state;

        if (!state || !state.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        currentUser = state.currentUser;

        document.documentElement.setAttribute('data-theme', state.ui?.theme || 'light');
        document.getElementById('theme-toggle').addEventListener('click', App.toggleTheme);
        document.getElementById('logout-btn').addEventListener('click', App.logout);

        // Load data
        allProjects = await fetchProjects();
        renderStats();
        renderTable();

        // Pipeline filter
        document.getElementById('pipeline-filter').addEventListener('click', (e) => {
            const step = e.target.closest('.pipeline-step');
            if (!step) return;
            activeFilter = step.dataset.s;
            document.querySelectorAll('.pipeline-step').forEach(s => s.classList.remove('active'));
            step.classList.add('active');
            renderTable(document.getElementById('project-search').value);
        });

        // Search
        document.getElementById('project-search').addEventListener('input', (e) => {
            renderTable(e.target.value);
        });

        // Modal controls
        document.getElementById('btn-new-project').addEventListener('click', openCreateModal);
        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-save').addEventListener('click', saveProject);
        document.getElementById('modal-project').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal-project')) closeModal();
        });

        // Detail modal controls
        document.getElementById('detail-close').addEventListener('click', closeDetail);
        document.getElementById('modal-detail').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal-detail')) closeDetail();
        });

        // Report controls
        document.getElementById('btn-create-survey').addEventListener('click', () => {
            if (!currentDetailId) return;
            window.location.href = `survey-report.html?projectId=${currentDetailId}`;
        });
        document.getElementById('btn-add-report').addEventListener('click', () => {
            document.getElementById('report-form-container').style.display = 'block';
            document.getElementById('rep-no').focus();
        });
        document.getElementById('btn-cancel-report').addEventListener('click', () => {
            document.getElementById('report-form-container').style.display = 'none';
        });
        document.getElementById('btn-save-report').addEventListener('click', saveReport);
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
