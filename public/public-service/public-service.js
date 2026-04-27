import { supabase } from '../../src/api/client.js';

(function() {
    // UI Elements
    const tabRequest = document.getElementById('tab-request');
    const tabTrack = document.getElementById('tab-track');
    const sectionRequest = document.getElementById('section-request');
    const sectionTrack = document.getElementById('section-track');

    const btnSubmit = document.getElementById('btn-submit');
    const btnTrackSearch = document.getElementById('btn-track');

    // Switch Tabs
    if (tabRequest && tabTrack) {
        tabRequest.addEventListener('click', () => {
            tabRequest.classList.add('active');
            tabTrack.classList.remove('active');
            sectionRequest.style.display = 'block';
            sectionTrack.style.display = 'none';
        });

        tabTrack.addEventListener('click', () => {
            tabTrack.classList.add('active');
            tabRequest.classList.remove('active');
            sectionTrack.style.display = 'block';
            sectionRequest.style.display = 'none';
        });
    }

    // Submit Request
    if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
            const name = document.getElementById('cust-name').value.trim();
            const phone = document.getElementById('cust-phone').value.trim();
            const subject = document.getElementById('cust-subject').value.trim();
            const detail = document.getElementById('cust-detail').value.trim();

            if (!name || !phone || !subject) {
                alert('กรุณากรอกข้อมูล ชื่อ, เบอร์โทร และหัวข้อแจ้งซ่อม');
                return;
            }

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'กำลังส่งข้อมูล...';

            try {
                const { error } = await supabase.from('service_requests').insert({
                    customer_name: name,
                    customer_phone: phone,
                    subject: subject,
                    details: detail,
                    department: 'Customer (Public)',
                    status: 'แจ้งงานเสร็จสิ้น' // Stage 1
                });

                if (error) throw error;

                alert('✅ ส่งข้อมูลแจ้งซ่อมเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด');
                
                // Clear form
                document.getElementById('cust-name').value = '';
                document.getElementById('cust-phone').value = '';
                document.getElementById('cust-subject').value = '';
                document.getElementById('cust-detail').value = '';
                
                // Switch to track tab to see results
                document.getElementById('track-phone').value = phone;
                if (tabTrack) tabTrack.click();
                handleTrack();

            } catch (err) {
                console.error('Submit Error:', err);
                alert('เกิดข้อผิดพลาด: ' + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = '📤 ส่งข้อมูลแจ้งซ่อม';
            }
        });
    }

    // Track Status
    if (btnTrackSearch) {
        btnTrackSearch.addEventListener('click', handleTrack);
        const trackPhoneInput = document.getElementById('track-phone');
        if (trackPhoneInput) {
            trackPhoneInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleTrack();
            });
        }
    }

    async function handleTrack() {
        const phoneInput = document.getElementById('track-phone');
        if (!phoneInput) return;
        
        const phone = phoneInput.value.trim();
        if (!phone) return;

        const resultDiv = document.getElementById('track-result');
        const emptyDiv = document.getElementById('track-empty');
        const infoDiv = document.getElementById('job-info');

        if (resultDiv) resultDiv.style.display = 'none';
        if (emptyDiv) emptyDiv.style.display = 'none';

        try {
            const { data, error } = await supabase
                .from('service_requests')
                .select('*')
                .eq('customer_phone', phone)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (!data || data.length === 0) {
                if (emptyDiv) emptyDiv.style.display = 'block';
                return;
            }

            const job = data[0];
            if (resultDiv) resultDiv.style.display = 'block';
            
            // Render Info
            if (infoDiv) {
                infoDiv.innerHTML = `
                    <div class="info-row">
                        <span class="info-label">หัวข้อแจ้งซ่อม:</span>
                        <span class="info-value">${job.subject}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">วันที่แจ้ง:</span>
                        <span class="info-value">${new Date(job.created_at).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">สถานะปัจจุบัน:</span>
                        <span class="info-value" style="color: var(--primary);">${job.status}</span>
                    </div>
                `;
            }

            // Update Steps
            updateProgressSteps(job.status);

        } catch (err) {
            console.error('Track Error:', err);
            alert('เกิดข้อผิดพลาดในการค้นหา');
        }
    }

    function updateProgressSteps(status) {
        // Reset steps
        const stepIds = ['step-1', 'step-2', 'step-3'];
        stepIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active', 'completed');
        });

        const s1 = document.getElementById('step-1');
        const s2 = document.getElementById('step-2');
        const s3 = document.getElementById('step-3');

        if (status === 'แจ้งงานเสร็จสิ้น' || status === 'รอดำเนินการ') {
            if (s1) s1.classList.add('active');
        } else if (status === 'กำลังดำเนินการ') {
            if (s1) s1.classList.add('completed');
            if (s2) s2.classList.add('active');
        } else if (status === 'ดำเนินการเสร็จสิ้น' || status === 'เสร็จสิ้น') {
            if (s1) s1.classList.add('completed');
            if (s2) s2.classList.add('completed');
            if (s3) {
                s3.classList.add('completed');
                s3.classList.add('active');
            }
        }
    }

})();
