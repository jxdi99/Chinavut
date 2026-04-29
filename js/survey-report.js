import { supabase } from '../src/api/client.js';

(function () {
    let currentProject = null;
    let currentUser = null;

    async function init() {
        await App.checkAuth();
        const state = await AppStorage.loadState();
        App.state = state;
        currentUser = state.currentUser;

        // Get Project ID from URL
        const params = new URLSearchParams(window.location.search);
        const projectId = params.get('projectId');
        
        if (!projectId) {
            alert('ไม่พบข้อมูลโปรเจค');
            window.location.href = 'led-projects.html';
            return;
        }

        // Fetch project details
        const { data, error } = await supabase
            .from('led_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !data) {
            alert('โหลดข้อมูลโปรเจคไม่สำเร็จ');
            window.location.href = 'led-projects.html';
            return;
        }

        currentProject = data;
        
        // Pre-fill form
        document.getElementById('sv-project-id').value = data.project_id;
        document.getElementById('sv-project-name').value = data.project_name;
        document.getElementById('sv-customer').value = data.customer_name;
        document.getElementById('sv-screen-size').value = data.screen_size || '';
        document.getElementById('sv-surveyor').value = currentUser?.fullName || '';

        // Event listener
        document.getElementById('btn-save-survey').addEventListener('click', saveSurvey);
    }

    async function generateDocNo() {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePrefix = `SUR-${yy}${mm}${dd}-`;

        // Check how many survey reports today
        const { data } = await supabase
            .from('project_reports')
            .select('doc_no')
            .eq('doc_type', 'Survey')
            .ilike('doc_no', datePrefix + '%');
        
        const count = data ? data.length : 0;
        const seq = String(count + 1).padStart(3, '0');
        return datePrefix + seq;
    }

    async function saveSurvey() {
        const surveyor = document.getElementById('sv-surveyor').value.trim();
        const size = document.getElementById('sv-screen-size').value.trim();
        
        if (!surveyor || !size) {
            App.showToast('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
            return;
        }

        const docNo = await generateDocNo();
        
        const details = {
            surveyor,
            site_type: document.getElementById('sv-site-type').value,
            screen_size: size,
            ground_clearance: document.getElementById('sv-ground-clearance').value,
            view_distance: document.getElementById('sv-view-dist').value,
            mount_type: document.getElementById('sv-mount-type').value,
            power: document.getElementById('sv-power').value,
            signal_distance: document.getElementById('sv-signal-dist').value,
            access: document.getElementById('sv-access').value,
            machinery: document.getElementById('sv-machinery').value,
            notes: document.getElementById('sv-notes').value
        };

        const payload = {
            project_id: currentProject.id,
            doc_no: docNo,
            doc_type: 'Survey',
            doc_url: document.getElementById('sv-photo-url').value.trim() || null,
            notes: `Site: ${details.site_type}, Mount: ${details.mount_type}`,
            details: details, // Requires JSONB column
            created_by: currentUser?.fullName || currentUser?.name || 'ไม่ทราบ',
        };

        App.showToast('กำลังบันทึกใบสำรวจ...');
        
        const { error } = await supabase.from('project_reports').insert(payload);
        
        if (error) {
            App.showToast('บันทึกไม่สำเร็จ: ' + error.message);
            return;
        }

        // Also update project status to 'survey' if it's currently 'new'
        if (currentProject.status === 'new') {
            await supabase.from('led_projects').update({ 
                status: 'survey', 
                updated_at: new Date().toISOString(),
                at_survey: new Date().toISOString()
            }).eq('id', currentProject.id);
        }

        App.showToast(`✅ บันทึกใบสำรวจ ${docNo} เรียบร้อย!`);
        
        setTimeout(() => {
            window.location.href = 'led-projects.html';
        }, 1500);
    }

    init();
})();
