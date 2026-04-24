import { MasterDataAPI } from '../src/api/client.js';

(function () {
    let masterDataCache = null;
    let stockData = {}; // Mock stock database structure: { itemId: { total: 0, reserved: 0, erp: 0, lastMovement: Date } }

    async function loadMockStockData() {
        // Since we don't have a real table, we use localStorage to mock the stock database
        const saved = localStorage.getItem('mockStockData');
        if (saved) {
            stockData = JSON.parse(saved);
        } else {
            stockData = {};
        }
        
        if (!masterDataCache) {
            masterDataCache = await MasterDataAPI.fetchFull();
        }

        // Initialize missing items with random mock data for demo purposes if not existing
        let needsSave = false;
        const allItems = getAllItems(masterDataCache);
        allItems.forEach(item => {
            if (!stockData[item.id]) {
                const isDeadStock = Math.random() > 0.8; // 20% chance to be mock dead stock
                const total = Math.floor(Math.random() * 50) + 10;
                const reserved = Math.floor(Math.random() * (total / 2));
                stockData[item.id] = {
                    total: total,
                    reserved: reserved,
                    erp: total, // Initially sync with ERP
                    lastMovement: isDeadStock ? (Date.now() - (180 * 24 * 60 * 60 * 1000)) : Date.now(), // 180 days ago
                    name: item.name,
                    category: item.category
                };
                needsSave = true;
            }
        });

        if (needsSave) {
            saveMockStockData();
        }
    }

    function saveMockStockData() {
        localStorage.setItem('mockStockData', JSON.stringify(stockData));
    }

    function getMockOtherDepartments() {
        return [
            // Audio System
            { id: 'm-audio-1', name: 'RAZR Ceiling Speaker 10W', price: 1200, category: 'audio' },
            { id: 'm-audio-2', name: 'RAZR Wireless Mic Dual', price: 8500, category: 'audio' },
            { id: 'm-audio-3', name: 'Digital DSP Mixer 8-Ch', price: 15000, category: 'audio' },
            // Projector
            { id: 'm-proj-1', name: 'RAZR Laser Projector 6000lm', price: 45000, category: 'projector' },
            { id: 'm-proj-2', name: 'RAZR Short Throw 4000lm', price: 32000, category: 'projector' },
            // Interactive Board
            { id: 'm-int-1', name: 'RAZR i-Board 65"', price: 55000, category: 'interactive' },
            { id: 'm-int-2', name: 'RAZR i-Board 86"', price: 95000, category: 'interactive' },
            // IT / Network
            { id: 'm-it-1', name: 'Cisco Switch 24-Port PoE', price: 18000, category: 'it' },
            { id: 'm-it-2', name: 'WiFi 6 Access Point', price: 6500, category: 'it' },
            { id: 'm-it-3', name: 'Video Conference Cam PTZ', price: 22000, category: 'it' }
        ];
    }

    function getAllItems(data) {
        let items = [];
        if (data) {
            ['UIR', 'UOS', 'CIH'].forEach(group => {
                if (data[group] && data[group].items) {
                    data[group].items.forEach(i => items.push({ ...i, category: 'led' }));
                }
            });
            if (data.controllers) {
                data.controllers.forEach(c => items.push({ ...c, category: 'controller' }));
            }
            if (data.accessories) {
                data.accessories.forEach(a => items.push({ ...a, category: 'accessory' }));
            }
        }
        
        // Append Mock Other Departments
        items = items.concat(getMockOtherDepartments());
        
        return items;
    }

    function initTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                const target = e.target.closest('.tab-btn');
                target.classList.add('active');
                const tabId = target.getAttribute('data-tab');
                document.getElementById(`tab-${tabId}`).classList.add('active');

                // Refresh specific tab data if needed
                if (tabId === 'executive') renderExecutiveOverview();
                if (tabId === 'overview') renderOverview();
                if (tabId === 'erp') renderErp();
                if (tabId === 'receive' || tabId === 'reserve') populateDropdowns();
            });
        });
    }

    function formatMoney(amount) {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
    }

    function renderExecutiveOverview() {
        const items = getAllItems(masterDataCache);
        
        let totalVal = 0;
        let availVal = 0;
        let deadVal = 0;
        let totalErpDiff = 0;
        let totalErpItems = 0;

        const deptMap = {
            'led': { name: 'จอ LED', sku: 0, qty: 0, val: 0, deadVal: 0 },
            'controller': { name: 'LED (Controller)', sku: 0, qty: 0, val: 0, deadVal: 0 },
            'accessory': { name: 'LED (Accessories)', sku: 0, qty: 0, val: 0, deadVal: 0 },
            'audio': { name: 'ระบบเสียง (Audio)', sku: 0, qty: 0, val: 0, deadVal: 0 },
            'projector': { name: 'โปรเจคเตอร์ (Projector)', sku: 0, qty: 0, val: 0, deadVal: 0 },
            'interactive': { name: 'จอสัมผัส (Interactive)', sku: 0, qty: 0, val: 0, deadVal: 0 },
            'it': { name: 'ไอที/เน็ตเวิร์ก (IT)', sku: 0, qty: 0, val: 0, deadVal: 0 }
        };

        items.forEach(item => {
            const stock = stockData[item.id] || { total: 0, reserved: 0, erp: 0, lastMovement: Date.now() };
            const price = item.price || 0;
            const available = stock.total - stock.reserved;
            
            const itemTotalVal = stock.total * price;
            const itemAvailVal = available * price;

            const daysSinceMovement = Math.floor((Date.now() - stock.lastMovement) / (1000 * 60 * 60 * 24));
            const isDead = stock.total > 0 && daysSinceMovement > 90;
            const itemDeadVal = isDead ? itemTotalVal : 0;

            totalVal += itemTotalVal;
            availVal += itemAvailVal;
            deadVal += itemDeadVal;

            if (stock.total !== stock.erp) totalErpDiff++;
            if (stock.total > 0 || stock.erp > 0) totalErpItems++;

            if (deptMap[item.category]) {
                deptMap[item.category].sku += 1;
                deptMap[item.category].qty += stock.total;
                deptMap[item.category].val += itemTotalVal;
                deptMap[item.category].deadVal += itemDeadVal;
            }
        });

        const deadPct = totalVal > 0 ? ((deadVal / totalVal) * 100).toFixed(1) : 0;
        const erpAcc = totalErpItems > 0 ? (((totalErpItems - totalErpDiff) / totalErpItems) * 100).toFixed(1) : 100;

        document.getElementById('kpi-total-val').textContent = formatMoney(totalVal);
        document.getElementById('kpi-avail-val').textContent = formatMoney(availVal);
        document.getElementById('kpi-dead-val').textContent = formatMoney(deadVal);
        document.getElementById('kpi-dead-pct').textContent = `คิดเป็น ${deadPct}% ของทั้งหมด`;
        
        const erpEl = document.getElementById('kpi-erp-acc');
        erpEl.textContent = `${erpAcc}%`;
        erpEl.style.color = erpAcc < 90 ? '#ef4444' : (erpAcc < 98 ? '#f59e0b' : '#3b82f6');

        // Render Table
        const tbody = document.getElementById('exec-dept-tbody');
        tbody.innerHTML = '';

        Object.values(deptMap).forEach(dept => {
            if (dept.sku === 0) return;
            const pct = totalVal > 0 ? ((dept.val / totalVal) * 100).toFixed(1) : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${dept.name}</strong></td>
                <td>${dept.sku}</td>
                <td>${dept.qty}</td>
                <td style="font-weight:bold; color:var(--primary);">${formatMoney(dept.val)}</td>
                <td style="color:${dept.deadVal > 0 ? '#ef4444' : 'inherit'}">${formatMoney(dept.deadVal)}</td>
                <td style="min-width: 120px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.85em;">
                        <span>${pct}%</span>
                    </div>
                    <div class="bar-chart-container">
                        <div class="bar-chart-fill" style="width: ${pct}%;"></div>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderOverview() {
        const tbody = document.getElementById('overview-tbody');
        const filter = document.getElementById('overview-category-filter').value;
        tbody.innerHTML = '';

        const items = getAllItems(masterDataCache);
        
        items.forEach(item => {
            if (filter !== 'all' && item.category !== filter) return;

            const stock = stockData[item.id] || { total: 0, reserved: 0, lastMovement: Date.now() };
            const available = stock.total - stock.reserved;
            
            // Dead stock logic (e.g. no movement for > 90 days and has stock)
            const daysSinceMovement = Math.floor((Date.now() - stock.lastMovement) / (1000 * 60 * 60 * 24));
            let deadStockBadge = '<span class="badge badge-success">เคลื่อนไหวปกติ</span>';
            if (stock.total > 0 && daysSinceMovement > 90) {
                deadStockBadge = `<span class="badge badge-danger">Dead Stock (${daysSinceMovement} วัน)</span>`;
            } else if (stock.total === 0) {
                deadStockBadge = '<span class="badge badge-secondary">ของหมด</span>';
            }

            const deptMap = {
                'led': { name: 'LED (จอ)' },
                'controller': { name: 'LED (Controller)' },
                'accessory': { name: 'LED (Accessories)' },
                'audio': { name: 'ระบบเสียง (Audio)' },
                'projector': { name: 'โปรเจคเตอร์ (Projector)' },
                'interactive': { name: 'จอสัมผัส (Interactive)' },
                'it': { name: 'ไอที/เน็ตเวิร์ก (IT)' }
            };

            let catLabel = deptMap[item.category] ? deptMap[item.category].name : item.category;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td>${catLabel}</td>
                <td style="font-weight:bold; color:var(--primary);">${stock.total}</td>
                <td style="color:#f59e0b;">${stock.reserved}</td>
                <td style="font-weight:bold; color:#10b981;">${available}</td>
                <td>${deadStockBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderErp() {
        const tbody = document.getElementById('erp-tbody');
        tbody.innerHTML = '';
        const items = getAllItems(masterDataCache);

        items.forEach(item => {
            const stock = stockData[item.id] || { total: 0, erp: 0 };
            const diff = stock.total - stock.erp;
            
            let statusBadge = '<span class="badge badge-success">ตรงกัน (Match)</span>';
            if (diff > 0) {
                statusBadge = '<span class="badge badge-warning">ระบบเรามากกว่า ERP</span>';
            } else if (diff < 0) {
                statusBadge = '<span class="badge badge-danger">ระบบเราน้อยกว่า ERP</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td>${stock.total}</td>
                <td>${stock.erp}</td>
                <td style="font-weight:bold; color:${diff === 0 ? 'inherit' : (diff > 0 ? '#f59e0b' : '#ef4444')}">${diff > 0 ? '+'+diff : diff}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function populateDropdowns() {
        const items = getAllItems(masterDataCache);
        const rcvSelect = document.getElementById('receive-item-select');
        const rsvSelect = document.getElementById('reserve-item-select');
        
        let options = '<option value="">-- เลือกสินค้า --</option>';
        items.forEach(item => {
            options += `<option value="${item.id}">${item.name} (${item.category})</option>`;
        });

        rcvSelect.innerHTML = options;
        rsvSelect.innerHTML = options;
    }

    function setupActions() {
        document.getElementById('overview-category-filter').addEventListener('change', renderOverview);

        // Receive Submit
        document.getElementById('btn-receive-submit').addEventListener('click', () => {
            const itemId = document.getElementById('receive-item-select').value;
            const qty = parseInt(document.getElementById('receive-qty').value, 10);
            
            if (!itemId || isNaN(qty) || qty <= 0) {
                App.showToast('กรุณาเลือกสินค้าและระบุจำนวนที่ถูกต้อง');
                return;
            }

            stockData[itemId].total += qty;
            stockData[itemId].lastMovement = Date.now();
            saveMockStockData();

            App.showToast('รับเข้าสินค้าสำเร็จ!');
            document.getElementById('receive-qty').value = '';
            document.getElementById('receive-note').value = '';
        });

        // Reserve Change Hint
        document.getElementById('reserve-item-select').addEventListener('change', (e) => {
            const itemId = e.target.value;
            const hint = document.getElementById('reserve-available-hint');
            if (itemId && stockData[itemId]) {
                const available = stockData[itemId].total - stockData[itemId].reserved;
                hint.textContent = `พร้อมขาย: ${available}`;
                hint.style.color = available > 0 ? '#10b981' : '#ef4444';
            } else {
                hint.textContent = 'พร้อมขาย: 0';
                hint.style.color = 'var(--muted)';
            }
        });

        // Reserve Submit
        document.getElementById('btn-reserve-submit').addEventListener('click', () => {
            const itemId = document.getElementById('reserve-item-select').value;
            const qty = parseInt(document.getElementById('reserve-qty').value, 10);
            
            if (!itemId || isNaN(qty) || qty <= 0) {
                App.showToast('กรุณาเลือกสินค้าและระบุจำนวนที่ถูกต้อง');
                return;
            }

            const available = stockData[itemId].total - stockData[itemId].reserved;
            if (qty > available) {
                App.showToast(`ไม่สามารถจองได้! สินค้าพร้อมขายมีเพียง ${available}`);
                return;
            }

            stockData[itemId].reserved += qty;
            stockData[itemId].lastMovement = Date.now();
            saveMockStockData();

            App.showToast('บันทึกการจองสำเร็จ!');
            document.getElementById('reserve-qty').value = '';
            document.getElementById('reserve-note').value = '';
            
            // Trigger change event to update hint
            document.getElementById('reserve-item-select').dispatchEvent(new Event('change'));
        });

        // Mock ERP Sync
        document.getElementById('btn-sync-erp').addEventListener('click', () => {
            App.showToast('กำลังซิงค์จำลองกับ ERP...');
            setTimeout(() => {
                // Randomly mess up some ERP numbers to show diffs
                const keys = Object.keys(stockData);
                keys.forEach(k => {
                    if (Math.random() > 0.7) {
                        const shift = Math.floor(Math.random() * 5) - 2; // -2 to +2
                        stockData[k].erp = Math.max(0, stockData[k].erp + shift);
                    } else {
                        // Some match exactly
                        stockData[k].erp = stockData[k].total;
                    }
                });
                saveMockStockData();
                renderErp();
                App.showToast('ดึงข้อมูล ERP จำลองสำเร็จ!');
            }, 800);
        });
    }

    async function init() {
        await App.checkAuth();
        App.renderWelcomeBanner();
        document.getElementById('logout-btn')?.addEventListener('click', App.logout);
        document.getElementById('theme-toggle')?.addEventListener('click', App.toggleTheme);

        await loadMockStockData();
        initTabs();
        setupActions();
        
        renderExecutiveOverview();
        renderOverview();
        populateDropdowns();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
