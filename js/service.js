import { supabase } from '../src/api/client.js';

(function() {
    let currentUser = null;
    let allJobs = [];

    async function init() {
        // Core initialization
        if (typeof App !== 'undefined') {
            await App.checkAuth();
            const state = await AppStorage.loadState();
            App.state = state;
            
            if (!state || !state.currentUser) {
                window.location.href = 'index.html';
                return;
            }
            currentUser = state.currentUser;

            // Theme initialization
            document.documentElement.setAttribute('data-theme', state.ui?.theme || 'light');
            
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) themeToggle.addEventListener('click', App.toggleTheme);
            
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) logoutBtn.addEventListener('click', App.logout);
        }

        // Service specific handlers
        const submitBtn = document.getElementById('service-submit');
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
        
        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) filterStatus.addEventListener('change', renderList);

        loadJobs();
    }

    async function loadJobs() {
        if (!supabase) {
            console.error('Supabase not connected');
            return;
        }
        
        const { data, error } = await supabase
            .from('service_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch error:', error);
            const container = document.getElementById('service-list');
            if (container) {
                container.innerHTML = `<div class="empty-state">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</div>`;
            }
            return;
        }

        allJobs = data || [];
        renderList();
    }

    function renderList() {
        const filterElement = document.getElementById('filter-status');
        const filter = filterElement ? filterElement.value : 'all';
        const container = document.getElementById('service-list');
        if (!container) return;
        
        let filtered = allJobs;
        if (filter !== 'all') {
            filtered = allJobs.filter(j => j.status === filter);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
                    <div>ไม่พบรายการแจ้งงาน</div>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map(job => {
            const isCompleted = job.status === 'ดำเนินการเสร็จสิ้น' || job.status === 'เสร็จสิ้น';
            const isProcessing = job.status === 'กำลังดำเนินการ';
            const isPending = job.status === 'แจ้งงานเสร็จสิ้น' || job.status === 'รอดำเนินการ';

            return `
                <div class="job-card">
                    <div class="job-info">
                        <div class="job-subject">${job.subject}</div>
                        <div class="job-meta">
                            <span>🏢 แผนก/ลูกค้า: ${job.department}</span>
                            <span>👤 โดย: ${job.customer_name || job.requested_by || 'ไม่ทราบ'}</span>
                            <span>📞 เบอร์: ${job.customer_phone || '-'}</span>
                            <span>📅 ${new Date(job.created_at).toLocaleDateString('th-TH', { 
                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}</span>
                        </div>
                        ${job.details ? `<div class="job-detail">${job.details}</div>` : ''}
                    </div>
                    <div class="job-actions">
                        <span class="status-badge ${isCompleted ? 'status-completed' : (isProcessing ? 'status-processing' : 'status-pending')}">
                            ${job.status}
                        </span>
                        <div style="display:flex; gap:8px; margin-top:10px;">
                            ${isPending ? 
                                `<button class="btn-action btn-process" data-id="${job.id}">⚙️ เริ่มดำเนินการ</button>` : ''}
                            ${!isCompleted ? 
                                `<button class="btn-action btn-finish" data-id="${job.id}">✅ เสร็จสิ้นงาน</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach buttons
        container.querySelectorAll('.btn-process').forEach(btn => {
            btn.addEventListener('click', () => updateJobStatus(btn.dataset.id, 'กำลังดำเนินการ'));
        });
        container.querySelectorAll('.btn-finish').forEach(btn => {
            btn.addEventListener('click', () => updateJobStatus(btn.dataset.id, 'ดำเนินการเสร็จสิ้น'));
        });
    }

    async function handleSubmit() {
        const subjectInput = document.getElementById('service-subject');
        const deptInput = document.getElementById('service-dept');
        const detailInput = document.getElementById('service-detail');

        const subject = subjectInput.value.trim();
        const dept = deptInput.value.trim();
        const details = detailInput.value.trim();

        if (!subject || !dept) {
            if (typeof App !== 'undefined') App.showToast('กรุณากรอกหัวข้อและแผนก');
            else alert('กรุณากรอกหัวข้อและแผนก');
            return;
        }

        if (typeof App !== 'undefined') App.showToast('กำลังส่งข้อมูล...');
        
        const { error } = await supabase.from('service_requests').insert({
            subject,
            department: dept,
            details: details,
            requested_by: currentUser ? (currentUser.fullName || currentUser.name || 'ไม่ทราบ') : 'ไม่ทราบ',
            status: 'รอดำเนินการ'
        });

        if (error) {
            if (typeof App !== 'undefined') App.showToast('ส่งข้อมูลไม่สำเร็จ: ' + error.message);
            else alert('ส่งข้อมูลไม่สำเร็จ: ' + error.message);
        } else {
            if (typeof App !== 'undefined') App.showToast('✅ ส่งแจ้งงานสำเร็จ!');
            subjectInput.value = '';
            deptInput.value = '';
            detailInput.value = '';
            loadJobs();
        }
    }

    async function updateJobStatus(id, newStatus) {
        if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${newStatus}"?`)) return;

        if (typeof App !== 'undefined') App.showToast('กำลังอัปเดต...');

        const { error } = await supabase
            .from('service_requests')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            if (typeof App !== 'undefined') App.showToast('อัปเดตไม่สำเร็จ: ' + error.message);
        } else {
            if (typeof App !== 'undefined') App.showToast('✅ อัปเดตสถานะเรียบร้อย');
            loadJobs();
        }
    }

    // Wait for core app dependencies
    function waitForApp() {
        if (typeof App !== 'undefined' && typeof AppStorage !== 'undefined') {
            init();
        } else {
            setTimeout(waitForApp, 50);
        }
    }

    waitForApp();
})();
