import{i as e}from"./client-fN6McSnU.js";import"./modulepreload-polyfill-iJ-6Fn-a.js";/* empty css               */import"./shared-uvIJ2Joy.js";(function(){let t=null,n=[];async function r(){if(typeof App<`u`){await App.checkAuth();let e=await AppStorage.loadState();if(App.state=e,!e||!e.currentUser){window.location.href=`index.html`;return}t=e.currentUser,document.documentElement.setAttribute(`data-theme`,e.ui?.theme||`light`);let n=document.getElementById(`theme-toggle`);n&&n.addEventListener(`click`,App.toggleTheme);let r=document.getElementById(`logout-btn`);r&&r.addEventListener(`click`,App.logout)}let e=document.getElementById(`service-submit`);e&&e.addEventListener(`click`,o);let n=document.getElementById(`filter-status`);n&&n.addEventListener(`change`,a),i()}async function i(){if(!e){console.error(`Supabase not connected`);return}let{data:t,error:r}=await e.from(`service_requests`).select(`*`).order(`created_at`,{ascending:!1});if(r){console.error(`Fetch error:`,r);let e=document.getElementById(`service-list`);e&&(e.innerHTML=`<div class="empty-state">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${r.message}</div>`);return}n=t||[],a()}function a(){let e=document.getElementById(`filter-status`),t=e?e.value:`all`,r=document.getElementById(`service-list`);if(!r)return;let i=n;if(t!==`all`&&(i=n.filter(e=>e.status===t)),i.length===0){r.innerHTML=`
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
                    <div>ไม่พบรายการแจ้งงาน</div>
                </div>`;return}r.innerHTML=i.map(e=>`
            <div class="job-card">
                <div class="job-info">
                    <div class="job-subject">${e.subject}</div>
                    <div class="job-meta">
                        <span>🏢 แผนก: ${e.department}</span>
                        <span>👤 โดย: ${e.requested_by||`ไม่ทราบ`}</span>
                        <span>📅 ${new Date(e.created_at).toLocaleDateString(`th-TH`,{year:`numeric`,month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`})}</span>
                    </div>
                    ${e.details?`<div class="job-detail">${e.details}</div>`:``}
                </div>
                <div class="job-actions">
                    <span class="status-badge ${e.status===`เสร็จสิ้น`?`status-completed`:`status-pending`}">
                        ${e.status}
                    </span>
                    ${e.status===`รอดำเนินการ`?`<button class="btn-complete" data-id="${e.id}">✅ ทำเครื่องหมายว่าเสร็จสิ้น</button>`:``}
                </div>
            </div>
        `).join(``),r.querySelectorAll(`.btn-complete`).forEach(e=>{e.addEventListener(`click`,()=>s(e.dataset.id))})}async function o(){let n=document.getElementById(`service-subject`),r=document.getElementById(`service-dept`),a=document.getElementById(`service-detail`),o=n.value.trim(),s=r.value.trim(),c=a.value.trim();if(!o||!s){typeof App<`u`?App.showToast(`กรุณากรอกหัวข้อและแผนก`):alert(`กรุณากรอกหัวข้อและแผนก`);return}typeof App<`u`&&App.showToast(`กำลังส่งข้อมูล...`);let{error:l}=await e.from(`service_requests`).insert({subject:o,department:s,details:c,requested_by:t&&(t.fullName||t.name)||`ไม่ทราบ`,status:`รอดำเนินการ`});l?typeof App<`u`?App.showToast(`ส่งข้อมูลไม่สำเร็จ: `+l.message):alert(`ส่งข้อมูลไม่สำเร็จ: `+l.message):(typeof App<`u`&&App.showToast(`✅ ส่งแจ้งงานสำเร็จ!`),n.value=``,r.value=``,a.value=``,i())}async function s(t){if(!confirm(`ยืนยันว่าดำเนินการเสร็จสิ้นแล้ว?`))return;typeof App<`u`&&App.showToast(`กำลังอัปเดต...`);let{error:n}=await e.from(`service_requests`).update({status:`เสร็จสิ้น`,updated_at:new Date().toISOString()}).eq(`id`,t);n?typeof App<`u`&&App.showToast(`อัปเดตไม่สำเร็จ: `+n.message):(typeof App<`u`&&App.showToast(`✅ บันทึกเสร็จสิ้นแล้ว`),i())}function c(){typeof App<`u`&&typeof AppStorage<`u`?r():setTimeout(c,50)}c()})();