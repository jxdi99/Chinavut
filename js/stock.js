(function() {
  const STORAGE_KEY = 'razr_stock_data';
  
  // Initial dummy data
  const initialData = [
    { id: 'LED-UIR-001', name: 'UIR 1.9 (Indoor)', dept: 'led', erpQty: 120, actualQty: 115, reserved: 20, depp: 5, price: 60000 },
    { id: 'LED-UOS-001', name: 'UOS 3.9 (Outdoor)', dept: 'led', erpQty: 50, actualQty: 50, reserved: 10, depp: 0, price: 85000 },
    { id: 'LED-CON-NOV', name: 'NovaStar TB60', dept: 'led', erpQty: 15, actualQty: 16, reserved: 2, depp: 0, price: 15000 },
    { id: 'MKT-BRO-001', name: 'โบรชัวร์ LED 2026', dept: 'marketing', erpQty: 1000, actualQty: 950, reserved: 0, depp: 50, price: 10 },
    { id: 'MKT-BAN-001', name: 'Roll-up Banner', dept: 'marketing', erpQty: 10, actualQty: 10, reserved: 2, depp: 0, price: 500 }
  ];

  let stockData = [];
  let currentTab = 'tab-overview';
  
  function init() {
    loadData();
    bindEvents();
    render();
  }

  function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      stockData = JSON.parse(saved);
    } else {
      stockData = initialData;
      saveData();
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stockData));
  }

  function bindEvents() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      if(!btn.hasAttribute('data-tab')) return;
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentTab = e.target.dataset.tab;
        render();
      });
    });

    // Search
    document.getElementById('search-stock').addEventListener('input', render);

    // Sync ERP (Mock)
    document.getElementById('btn-sync-erp').addEventListener('click', () => {
      App.showToast('กำลังซิงค์ข้อมูลกับ ERP...');
      setTimeout(() => {
        App.showToast('อัปเดตข้อมูล ERP ล่าสุดเรียบร้อยแล้ว');
        render();
      }, 800);
    });

    // Modals
    document.getElementById('btn-receive').addEventListener('click', () => openModal('receive'));
    document.getElementById('btn-reserve').addEventListener('click', () => openModal('reserve'));
    
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-confirm').addEventListener('click', confirmAction);
  }

  let actionType = '';
  function openModal(type) {
    actionType = type;
    document.getElementById('action-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = type === 'receive' ? 'รับเข้าสินค้า' : 'จองสินค้า';
    
    const select = document.getElementById('modal-item-select');
    select.innerHTML = '';
    stockData.forEach(item => {
      select.innerHTML += `<option value="${item.id}">${item.id} - ${item.name} (Avail: ${item.actualQty - item.reserved - item.depp})</option>`;
    });
    
    document.getElementById('modal-qty').value = 1;
    document.getElementById('modal-note').value = '';
    document.getElementById('modal-note-field').style.display = type === 'reserve' ? 'block' : 'none';
  }

  function closeModal() {
    document.getElementById('action-modal').style.display = 'none';
  }

  function confirmAction() {
    const id = document.getElementById('modal-item-select').value;
    const qty = parseInt(document.getElementById('modal-qty').value) || 0;
    const note = document.getElementById('modal-note').value;

    if (qty <= 0) {
      alert('จำนวนต้องมากกว่า 0');
      return;
    }

    const item = stockData.find(x => x.id === id);
    if (!item) return;

    if (actionType === 'receive') {
      item.actualQty += qty;
      App.showToast(`รับเข้า ${item.name} จำนวน ${qty} ชิ้นเรียบร้อย`);
    } else if (actionType === 'reserve') {
      const avail = item.actualQty - item.reserved - item.depp;
      if (qty > avail) {
        alert(`จองไม่ได้! สินค้าว่างมีแค่ ${avail} ชิ้น`);
        return;
      }
      item.reserved += qty;
      App.showToast(`จอง ${item.name} จำนวน ${qty} ชิ้นเรียบร้อย`);
    }

    saveData();
    closeModal();
    render();
  }

  function render() {
    const search = document.getElementById('search-stock').value.toLowerCase();
    
    let filtered = stockData.filter(item => {
      if (search && !item.name.toLowerCase().includes(search) && !item.id.toLowerCase().includes(search)) return false;
      if (currentTab === 'tab-led' && item.dept !== 'led') return false;
      if (currentTab === 'tab-marketing' && item.dept !== 'marketing') return false;
      return true;
    });

    const tbody = document.getElementById('stock-table-body');
    tbody.innerHTML = '';

    let sumErpVal = 0;
    let sumActual = 0;
    let sumDiff = 0;
    let sumDead = 0;

    filtered.forEach(item => {
      const diff = item.actualQty - item.erpQty;
      const available = item.actualQty - item.reserved - item.depp;

      // Overview math
      sumErpVal += (item.erpQty * item.price);
      sumActual += item.actualQty;
      sumDiff += Math.abs(diff);
      sumDead += item.depp;

      const diffHtml = diff === 0 
        ? `<span class="diff-ok">0</span>` 
        : `<span class="diff-alert">${diff > 0 ? '+'+diff : diff}</span>`;

      tbody.innerHTML += `
        <tr>
          <td><strong>${item.id}</strong></td>
          <td>${item.name}</td>
          <td><span class="badge" style="background:var(--card); border:1px solid var(--border); color:var(--text);">${item.dept.toUpperCase()}</span></td>
          <td class="qty-col">${item.erpQty.toLocaleString()}</td>
          <td class="qty-col">${item.actualQty.toLocaleString()}</td>
          <td class="qty-col">${diffHtml}</td>
          <td class="qty-col" style="color:var(--warning);">${item.reserved.toLocaleString()}</td>
          <td class="qty-col" style="color:var(--success); font-weight:bold;">${available.toLocaleString()}</td>
          <td class="qty-col" style="color:var(--danger);">${item.depp.toLocaleString()}</td>
          <td style="text-align:center;">
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.8em;" onclick="alert('ดูประวัติรายการเบิก-จ่าย ของ ${item.id} (Coming Soon)')">History</button>
          </td>
        </tr>
      `;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px; color:var(--muted);">ไม่พบรายการสินค้า</td></tr>`;
    }

    document.getElementById('sum-erp-val').textContent = '฿' + sumErpVal.toLocaleString();
    document.getElementById('sum-actual-qty').innerHTML = sumActual.toLocaleString() + ' <span style="font-size:0.5em;font-weight:normal;">ชิ้น</span>';
    document.getElementById('sum-diff').textContent = sumDiff.toLocaleString();
    document.getElementById('sum-dead-stock').textContent = sumDead.toLocaleString();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
