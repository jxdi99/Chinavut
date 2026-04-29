import { supabase } from '../src/api/client.js';

(function () {
    let currentProject = null;
    let currentUser = null;
    let allInventory = [];
    let allTransactions = [];

    async function init() {
        await App.checkAuth();
        const state = await AppStorage.loadState();
        App.state = state;
        currentUser = state.currentUser;

        const params = new URLSearchParams(window.location.search);
        const projectId = params.get('projectId');
        
        if (!projectId) {
            alert('ไม่พบข้อมูลโปรเจค');
            window.location.href = 'booking.html';
            return;
        }

        const idNum = parseInt(projectId);
        console.log('Fetching data for Project ID:', idNum);

        // Fetch data individually to catch specific errors
        const projRes = await supabase.from('led_projects').select('*').eq('id', idNum).single();
        const invRes = await supabase.from('led_inventory').select('*');
        const txnRes = await supabase.from('led_transactions').select('*');
        const modelRes = await supabase.from('led_models').select('name, id').order('name');

        if (projRes.error) {
            console.error('Project fetch error:', projRes.error);
            alert('โหลดข้อมูลโปรเจคไม่สำเร็จ: ' + projRes.error.message);
            window.location.href = 'booking.html';
            return;
        }

        if (invRes.error) console.error('Inventory fetch error:', invRes.error);
        if (modelRes.error) console.error('Models fetch error:', modelRes.error);

        currentProject = projRes.data;
        allInventory = invRes.data || [];
        allTransactions = txnRes.data || [];
        const allModels = modelRes.data || [];

        console.log('Inventory loaded:', allInventory.length, 'items');
        console.log('Models loaded:', allModels.length, 'items');

        // Pre-fill
        document.getElementById('bk-project-name').value = `${currentProject.project_id} - ${currentProject.project_name} (${currentProject.customer_name})`;
        document.getElementById('bk-date').value = new Date().toISOString().split('T')[0];

        // Populate Model dropdown from master list (led_models)
        const modelSel = document.getElementById('bk-model');
        modelSel.innerHTML = '<option value="">-- เลือกรุ่น --</option>' + 
            allModels.map(m => `<option value="${m.name}" data-id="${m.id}">${m.name}</option>`).join('') +
            '<option value="unspecified">-- ไม่ระบุรุ่น --</option>';

        // Event listeners
        modelSel.addEventListener('change', updateLotDropdown);
        document.getElementById('bk-lot').addEventListener('change', updateStockDisplay);
        document.getElementById('btn-save-booking').addEventListener('click', saveBooking);
    }

    function updateLotDropdown() {
        const model = modelSel.value;
        const modelId = modelSel.options[modelSel.selectedIndex]?.dataset.id;
        const lotSel = document.getElementById('bk-lot');
        document.getElementById('stock-display').style.display = 'none';

        if (!model) {
            lotSel.innerHTML = '<option value="">-- เลือก Lot --</option>';
            return;
        }

        let filteredLots = [];
        if (model === 'unspecified') {
            filteredLots = allInventory.filter(i => !i.model);
        } else {
            // Match by name or ID
            filteredLots = allInventory.filter(i => i.model === model || i.model === modelId);
        }

        if (filteredLots.length === 0) {
            lotSel.innerHTML = '<option value="">-- ไม่มีสินค้าในสต๊อก --</option>';
            return;
        }

        const lots = [...new Set(filteredLots.map(i => i.lot_number))].sort();
        lotSel.innerHTML = '<option value="">-- เลือก Lot --</option>' + 
            lots.map(l => `<option value="${l}">${l}</option>`).join('');
    }

    function updateStockDisplay() {
        const lot = document.getElementById('bk-lot').value;
        const display = document.getElementById('stock-display');
        
        if (!lot) {
            display.style.display = 'none';
            return;
        }

        // Calculate available stock for this Lot
        // 1. Total In (Inventory)
        const totalIn = allInventory
            .filter(i => i.lot_number === lot)
            .reduce((acc, curr) => ({
                cab: acc.cab + (curr.cabinet || 0),
                mod: acc.mod + (curr.module || 0)
            }), { cab: 0, mod: 0 });

        // 2. Total Out/Booked (Transactions)
        // Note: In a real system, 'book' might just reserve, but for available stock calculation, we treat it as "not available"
        const totalOut = allTransactions
            .filter(t => t.lot_number === lot)
            .reduce((acc, curr) => {
                const cab = curr.cabinet_qty || 0;
                const mod = curr.module_qty || 0;
                // book, sell, borrow are all "Outs" from available stock
                if (['book', 'sell', 'borrow'].includes(curr.txn_type)) {
                    return { cab: acc.cab + cab, mod: acc.mod + mod };
                }
                // return is "In" back to available stock
                if (curr.txn_type === 'return') {
                    return { cab: acc.cab - cab, mod: acc.mod - mod };
                }
                return acc;
            }, { cab: 0, mod: 0 });

        const availCab = totalIn.cab - totalOut.cab;
        const availMod = totalIn.mod - totalOut.mod;

        document.getElementById('avail-cab').textContent = availCab;
        document.getElementById('avail-mod').textContent = availMod;
        display.style.display = 'block';
    }

    async function saveBooking() {
        const lot = document.getElementById('bk-lot').value;
        const cab = parseInt(document.getElementById('bk-cabinet').value) || 0;
        const mod = parseInt(document.getElementById('bk-module').value) || 0;
        
        if (!lot) { App.showToast('กรุณาเลือก Lot สินค้า'); return; }
        if (cab === 0 && mod === 0) { App.showToast('กรุณาระบุจำนวนที่ต้องการจอง'); return; }

        const payload = {
            lot_number: lot,
            model: document.getElementById('bk-model').value,
            txn_type: 'book',
            cabinet_qty: cab,
            module_qty: mod,
            txn_date: document.getElementById('bk-date').value,
            reference: document.getElementById('bk-ref').value.trim() || `BK-${currentProject.project_id}`,
            customer: currentProject.customer_name,
            salesperson: currentProject.salesperson,
            notes: document.getElementById('bk-notes').value.trim(),
            created_by: currentUser?.fullName || currentUser?.name || 'ไม่ทราบ',
        };

        App.showToast('กำลังบันทึกรายการจอง...');

        // 1. Insert into Transactions
        const { error: txnErr } = await supabase.from('led_transactions').insert(payload);
        if (txnErr) { App.showToast('บันทึกไม่สำเร็จ: ' + txnErr.message); return; }

        // 2. Also record in Project Reports for history
        await supabase.from('project_reports').insert({
            project_id: currentProject.id,
            doc_no: payload.reference,
            doc_type: 'Booking',
            notes: `จองสินค้า Lot: ${lot} (Cab: ${cab}, Mod: ${mod})`,
            created_by: payload.created_by
        });

        // 3. Update project status if needed
        if (currentProject.status === 'quotation' || currentProject.status === 'demo') {
            await supabase.from('led_projects').update({ 
                status: 'booking', 
                updated_at: new Date().toISOString(),
                at_booking: new Date().toISOString()
            }).eq('id', currentProject.id);
        }

        App.showToast('✅ จองสินค้าเรียบร้อย!');
        setTimeout(() => window.location.href = 'booking.html', 1500);
    }

    init();
})();
