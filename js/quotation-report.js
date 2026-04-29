import { supabase } from '../src/api/client.js';

(function () {
    let currentProject = null;
    let currentUser = null;

    async function init() {
        await App.checkAuth();
        const state = await AppStorage.loadState();
        App.state = state;
        currentUser = state.currentUser;

        const params = new URLSearchParams(window.location.search);
        const projectId = params.get('projectId');
        
        if (!projectId) {
            alert('ไม่พบข้อมูลโปรเจค');
            window.location.href = 'quotation.html';
            return;
        }

        const { data, error } = await supabase
            .from('led_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !data) {
            alert('โหลดข้อมูลโปรเจคไม่สำเร็จ');
            window.location.href = 'quotation.html';
            return;
        }

        currentProject = data;
        document.getElementById('qt-project-id').value = data.project_id;
        document.getElementById('qt-project-name').value = `${data.project_name} (${data.customer_name})`;
        document.getElementById('qt-amount').value = data.est_value || '';
        document.getElementById('qt-issuer').value = currentUser?.fullName || currentUser?.name || '';

        // Image preview logic
        const imgInput = document.getElementById('qt-image-url');
        const imgPreview = document.getElementById('img-preview');
        const imgPlaceholder = document.getElementById('img-placeholder');

        imgInput.addEventListener('input', () => {
            const url = imgInput.value.trim();
            if (url) {
                imgPreview.src = url;
                imgPreview.style.display = 'block';
                imgPlaceholder.style.display = 'none';
            } else {
                imgPreview.style.display = 'none';
                imgPlaceholder.style.display = 'block';
            }
        });

        imgPreview.onerror = () => {
            imgPreview.style.display = 'none';
            imgPlaceholder.style.display = 'block';
            imgPlaceholder.textContent = '❌ ลิงก์รูปภาพไม่ถูกต้อง';
        };

        document.getElementById('btn-save-quote').addEventListener('click', saveQuotation);
    }

    async function saveQuotation() {
        const docNo = document.getElementById('qt-no').value.trim();
        if (!docNo) { App.showToast('กรุณากรอกเลขที่ใบเสนอราคา'); return; }

        const payload = {
            project_id: currentProject.id,
            doc_no: docNo,
            doc_type: 'Quotation',
            doc_url: document.getElementById('qt-image-url').value.trim() || null,
            notes: document.getElementById('qt-notes').value.trim() || null,
            details: {
                amount: document.getElementById('qt-amount').value,
                issuer: document.getElementById('qt-issuer').value,
            },
            created_by: currentUser?.fullName || currentUser?.name || 'ไม่ทราบ',
        };

        App.showToast('กำลังบันทึก...');
        const { error } = await supabase.from('project_reports').insert(payload);
        
        if (error) {
            App.showToast('บันทึกไม่สำเร็จ: ' + error.message);
            return;
        }

        // Update project status to 'demo' or 'booking' or keep as quotation?
        // Usually, after quotation comes 'demo' or 'booking'
        // For now, we just ensure it's marked as 'quotation' stage
        if (currentProject.status === 'survey') {
            await supabase.from('led_projects').update({ 
                status: 'quotation', 
                updated_at: new Date().toISOString(),
                at_quotation: new Date().toISOString()
            }).eq('id', currentProject.id);
        }

        App.showToast(`✅ บันทึกใบเสนอราคา ${docNo} เรียบร้อย!`);
        setTimeout(() => window.location.href = 'quotation.html', 1500);
    }

    init();
})();
