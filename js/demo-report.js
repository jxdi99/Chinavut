import { supabase } from '../src/api/client.js';

(function () {
    let currentProject = null;
    let currentUser = null;
    let allInventory = [];

    async function init() {
        await App.checkAuth();
        const state = await AppStorage.loadState();
        App.state = state;
        currentUser = state.currentUser;

        const params = new URLSearchParams(window.location.search);
        const projectId = params.get('projectId');
        
        if (!projectId) {
            alert('ไม่พบข้อมูลโปรเจค');
            window.location.href = 'demo.html';
            return;
        }

        const idNum = parseInt(projectId);
        console.log('Loading data for Project:', idNum);

        // Fetch data individually to isolate errors
        const projRes = await supabase.from('led_projects').select('*').eq('id', idNum).single();
        if (projRes.error) {
            console.error('Project Error:', projRes.error);
            alert('ไม่พบข้อมูลโปรเจค: ' + projRes.error.message);
            window.location.href = 'demo.html';
            return;
        }

        const invRes = await supabase.from('led_inventory').select('*');
        if (invRes.error) {
            console.error('Inventory Error:', invRes.error);
            alert('โหลดสต๊อกไม่สำเร็จ: ' + invRes.error.message);
        }

        const modelRes = await supabase.from('led_models').select('name, id').order('name');
        if (modelRes.error) {
            console.error('Models Error:', modelRes.error);
            alert('โหลดรายชื่อรุ่นสินค้าไม่สำเร็จ: ' + modelRes.error.message);
        }

        currentProject = projRes.data;
        allInventory = invRes.data || [];
        const allModels = modelRes.data || [];

        console.log('Inventory items:', allInventory.length);
        console.log('Models found:', allModels.length);

        if (allModels.length === 0) {
            alert('คำเตือน: ไม่พบรายชื่อรุ่นสินค้าในฐานข้อมูล (led_models)');
        }

        // Pre-fill
        document.getElementById('dm-project-name').value = `${currentProject.project_id} - ${currentProject.project_name}`;
        document.getElementById('dm-date').value = new Date().toISOString().split('T')[0];

        // Type Toggle logic
        const typeNew = document.getElementById('type-new');
        const typeExisting = document.getElementById('type-existing');
        const sectionWithdrawal = document.getElementById('section-withdrawal');

        typeNew.addEventListener('click', () => {
            document.querySelector('input[name="demo-type"][value="new"]').checked = true;
            typeNew.classList.add('active');
            typeExisting.classList.remove('active');
            sectionWithdrawal.style.display = 'block';
        });

        typeExisting.addEventListener('click', () => {
            document.querySelector('input[name="demo-type"][value="existing"]').checked = true;
            typeExisting.classList.add('active');
            typeNew.classList.remove('active');
            sectionWithdrawal.style.display = 'none';
        });

        // Qty Buttons logic
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('dm-qty').value = btn.dataset.val;
            });
        });

        // Populate Model dropdown
        const modelSel = document.getElementById('dm-model');
        modelSel.innerHTML = '<option value="">-- เลือกรุ่น --</option>' + 
            allModels.map(m => `<option value="${m.name}" data-id="${m.id}">${m.name}</option>`).join('') +
            '<option value="unspecified">-- ไม่ระบุรุ่น --</option>';

        modelSel.addEventListener('change', () => {
            const model = modelSel.value;
            const modelId = modelSel.options[modelSel.selectedIndex]?.dataset.id;
            const lotSel = document.getElementById('dm-lot');
            if (!model) { lotSel.innerHTML = '<option value="">-- เลือก Lot --</option>'; return; }
            
            let filteredLots = [];
            if (model === 'unspecified') {
                filteredLots = allInventory.filter(i => !i.model);
            } else {
                filteredLots = allInventory.filter(i => i.model === model || i.model === modelId);
            }

            if (filteredLots.length === 0) {
                lotSel.innerHTML = '<option value="">-- ไม่มีสินค้าในสต๊อก --</option>';
            } else {
                const lots = [...new Set(filteredLots.map(i => i.lot_number))].sort();
                lotSel.innerHTML = '<option value="">-- เลือก Lot --</option>' + lots.map(l => `<option value="${l}">${l}</option>`).join('');
            }
        });

        document.getElementById('btn-save-demo').addEventListener('click', saveDemo);
    }

    async function saveDemo() {
        const type = document.querySelector('input[name="demo-type"]:checked').value;
        const model = document.getElementById('dm-model').value;
        const lot = document.getElementById('dm-lot').value;
        const qty = parseInt(document.getElementById('dm-qty').value);
        const date = document.getElementById('dm-date').value;
        const notes = document.getElementById('dm-notes').value.trim();
        const imageUrl = document.getElementById('dm-image-url').value.trim();

        if (type === 'new' && !lot) { App.showToast('กรุณาเลือก Lot สินค้าที่ต้องการเบิก'); return; }

        App.showToast('กำลังบันทึกรายงาน...');

        // 1. Record in project_reports
        const docNo = `DM-${currentProject.project_id}-${Date.now().toString().slice(-4)}`;
        const reportPayload = {
            project_id: currentProject.id,
            doc_no: docNo,
            doc_type: 'Demo',
            doc_url: imageUrl || null,
            notes: notes || (type === 'existing' ? 'ลูกค้าเก่า ข้ามขั้นตอนเบิกของ' : `เบิกของเดโม่ Lot: ${lot} จำนวน ${qty} ตู้`),
            created_by: currentUser?.fullName || currentUser?.name || 'ไม่ทราบ',
            details: { type, model, lot, qty, date }
        };

        const { error: repErr } = await supabase.from('project_reports').insert(reportPayload);
        if (repErr) { App.showToast('บันทึกรายงานไม่สำเร็จ: ' + repErr.message); return; }

        // 2. Record Withdrawal in led_transactions (only if type is 'new')
        if (type === 'new') {
            const txnPayload = {
                lot_number: lot,
                model: model === 'ไม่ระบุรุ่น' ? null : model,
                txn_type: 'borrow', // Withdraw for demo is 'borrow'
                cabinet_qty: qty,
                module_qty: 0,
                txn_date: date,
                reference: docNo,
                customer: currentProject.customer_name,
                salesperson: currentProject.salesperson,
                notes: `เบิกไปทำ Demo: ${notes}`,
                created_by: reportPayload.created_by
            };
            await supabase.from('led_transactions').insert(txnPayload);
        }

        // 3. Update Project Status to 'demo' (if currently quotation or survey)
        if (['survey', 'quotation'].includes(currentProject.status)) {
            await supabase.from('led_projects').update({ 
                status: 'demo', 
                updated_at: new Date().toISOString(),
                at_demo: new Date().toISOString()
            }).eq('id', currentProject.id);
        }

        App.showToast('✅ บันทึกรายงานเดโม่เรียบร้อย!');
        setTimeout(() => window.location.href = 'demo.html', 1500);
    }

    init();
})();
