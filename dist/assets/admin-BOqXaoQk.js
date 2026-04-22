import"./shared-C1HfS9Ki.js";/* empty css               */(function(){let e,t=!1,n=`UIR`,r=null;function i(){return e.masterData}function a(){return i()[n]}function o(e){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function s(){document.title=App.t(`adminTitle`),document.getElementById(`admin-title`).textContent=App.t(`adminTitle`),document.getElementById(`admin-subtitle`).textContent=App.t(`adminSub`),document.getElementById(`admin-group-label`).textContent=App.t(`targetGroup`),App.applyLanguage()}function c(){document.getElementById(`login-modal`).style.display=`flex`,document.getElementById(`login-user`).value=`admin`,document.getElementById(`login-pass`).value=``,setTimeout(()=>document.getElementById(`login-pass`).focus(),50)}function l(){document.getElementById(`login-modal`).style.display=`none`}function u(){App.renderWelcomeBanner(),document.getElementById(`login-btn`).style.display=t?`none`:`inline-block`,document.getElementById(`logout-btn`).style.display=t?`inline-block`:`none`,document.getElementById(`admin-panel`).style.display=t?`block`:`none`,document.getElementById(`admin-add-btn`).style.display=t?`inline-block`:`none`,document.getElementById(`admin-save-btn`).style.display=t?`inline-block`:`none`,document.getElementById(`admin-reset-btn`).style.display=`inline-block`,t&&(document.getElementById(`admin-group`).value=n,p())}async function d(){await AppStorage.saveState(e),App.showToast(App.t(`saved`))}function f(){clearTimeout(r),r=setTimeout(async()=>{await AppStorage.saveState(e)},250)}function p(){if(!t)return;let e=document.getElementById(`admin-thead`),r=document.getElementById(`admin-tbody`);if(n===`controllers`)e.innerHTML=`
        <tr>
          <th style="width:40px;"></th>
          <th>${App.t(`controllerName`)}</th>
          <th>${App.t(`load`)}</th>
          <th>${App.t(`price`)}</th>
          <th>${App.t(`manage`)}</th>
        </tr>`,r.innerHTML=i().controllers.map((e,t)=>`
        <tr data-index="${t}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="controller" data-field="name" data-index="${t}" type="text" value="${o(e.name)}"></td>
          <td><input data-kind="controller" data-field="load" data-index="${t}" type="number" value="${e.load}"></td>
          <td><input data-kind="controller" data-field="price" data-index="${t}" type="number" value="${e.price}"></td>
          <td>
            <button class="mini-btn delete" data-action="delete-controller" data-index="${t}">${App.t(`delete`)}</button>
          </td>
        </tr>
      `).join(``);else if(n===`accessories`)e.innerHTML=`
        <tr>
          <th style="width:40px;"></th>
          <th>${App.t(`accName`)}</th>
          <th>${App.t(`price`)}</th>
          <th>${App.t(`manage`)}</th>
        </tr>`,r.innerHTML=(i().accessories||[]).map((e,t)=>`
        <tr data-index="${t}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="accessory" data-field="name" data-index="${t}" type="text" value="${o(e.name)}"></td>
          <td><input data-kind="accessory" data-field="price" data-index="${t}" type="number" value="${e.price}"></td>
          <td>
            <button class="mini-btn delete" data-action="delete-accessory" data-index="${t}">${App.t(`delete`)}</button>
          </td>
        </tr>
      `).join(``);else{let t=a().items;e.innerHTML=`
        <tr>
          <th style="width:40px;"></th>
          <th>${App.t(`name`)}</th>
          <th>${App.t(`rw`)}</th>
          <th>${App.t(`rh`)}</th>
          <th>${App.t(`max`)}</th>
          <th>${App.t(`avg`)}</th>
          <th>${App.t(`pricePerCab`)}</th>
          <th>${App.t(`manage`)}</th>
        </tr>`,r.innerHTML=t.map((e,t)=>`
        <tr data-index="${t}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="item" data-field="name" data-index="${t}" type="text" value="${o(e.name)}"></td>
          <td><input data-kind="item" data-field="rw" data-index="${t}" type="number" value="${e.rw}"></td>
          <td><input data-kind="item" data-field="rh" data-index="${t}" type="number" value="${e.rh}"></td>
          <td><input data-kind="item" data-field="max" data-index="${t}" type="number" value="${e.max}"></td>
          <td><input data-kind="item" data-field="avg" data-index="${t}" type="number" value="${e.avg}"></td>
          <td><input data-kind="item" data-field="price" data-index="${t}" type="number" value="${e.price}"></td>
          <td>
            <button class="mini-btn delete" data-action="delete-item" data-index="${t}">${App.t(`delete`)}</button>
          </td>
        </tr>
      `).join(``)}}function m(){n!==`controllers`&&n!==`accessories`&&!i()[n]&&(n=`UIR`)}function h(){t&&(m(),n===`controllers`?i().controllers.push({name:`NEW`,load:1e6,price:0}):n===`accessories`?(i().accessories||(i().accessories=[]),i().accessories.push({name:`NEW ACCESSORY`,price:0})):a().items.push({name:`NEW MODEL`,rw:0,rh:0,max:0,avg:0,price:0}),p(),f())}function g(e){confirm(App.t(`confirmDelete`))&&(a().items.splice(e,1),p(),f())}function _(e){confirm(App.t(`confirmDeleteCon`))&&(i().controllers.splice(e,1),p(),f())}function v(e){confirm(App.t(`confirmDelete`))&&(i().accessories&&i().accessories.splice(e,1),p(),f())}function y(e){let t=e.target;if(!(t instanceof HTMLInputElement))return;let n=Number(t.dataset.index),r=t.dataset.field,o=t.dataset.kind;!r||Number.isNaN(n)||(o===`item`&&a().items[n]?a().items[n][r]=r===`name`?t.value:Number(t.value||0):o===`controller`&&i().controllers[n]?i().controllers[n][r]=r===`name`?t.value:Number(t.value||0):o===`accessory`&&i().accessories[n]&&(i().accessories[n][r]=r===`name`?t.value:Number(t.value||0)),f())}function b(e){let t=e.target.closest(`button[data-action]`);if(!t)return;let n=Number(t.dataset.index),r=t.dataset.action;r===`delete-item`&&g(n),r===`delete-controller`&&_(n),r===`delete-accessory`&&v(n)}let x=null;function S(){let e=document.getElementById(`admin-tbody`);e.addEventListener(`mousedown`,e=>{if(e.target.classList.contains(`drag-handle`)){let t=e.target.closest(`tr`);t&&t.setAttribute(`draggable`,`true`)}}),e.addEventListener(`mouseup`,e=>{let t=e.target.closest(`tr`);t&&t.hasAttribute(`draggable`)&&t.removeAttribute(`draggable`)}),e.addEventListener(`dragstart`,e=>{let t=e.target.closest(`tr`);t&&(x=Number(t.dataset.index),e.dataTransfer.effectAllowed=`move`,t.style.opacity=`0.6`)}),e.addEventListener(`dragover`,e=>{e.preventDefault(),e.dataTransfer.dropEffect=`move`;let t=e.target.closest(`tr`);t&&Number(t.dataset.index)!==x&&(t.style.borderTop=`3px solid var(--primary)`)}),e.addEventListener(`dragleave`,e=>{let t=e.target.closest(`tr`);t&&(t.style.borderTop=``)}),e.addEventListener(`drop`,e=>{e.preventDefault();let t=e.target.closest(`tr`);if(!t)return;t.style.borderTop=``;let r=Number(t.dataset.index);if(x===null||r===x)return;let o;o=n===`controllers`?i().controllers:n===`accessories`?i().accessories:a().items;let s=o.splice(x,1)[0];o.splice(r,0,s),p(),f()}),e.addEventListener(`dragend`,t=>{let n=t.target.closest(`tr`);n&&(n.style.opacity=`1`,n.removeAttribute(`draggable`)),Array.from(e.querySelectorAll(`tr`)).forEach(e=>e.style.borderTop=``),x=null})}async function C(){let e=document.getElementById(`login-user`).value.trim(),n=document.getElementById(`login-pass`).value;if(e===`admin`&&n===`1`){t=!0,l(),u(),App.showToast(App.t(`loginOk`));return}alert(App.t(`loginFail`))}async function w(){t=!1,u()}async function T(){await d(),App.showToast(App.t(`saved`))}async function E(){confirm(App.t(`confirmReset`))&&(e.masterData=App.clone(DEFAULT_DATA),await AppStorage.saveState(e),p(),App.showToast(App.t(`resetDone`)))}async function D(){await App.checkAuth(),e=await AppStorage.loadState(),e.ui=e.ui||{theme:`light`,lang:`th`},e.masterData=e.masterData||App.clone(DEFAULT_DATA),e.masterData.accessories||(e.masterData.accessories=App.clone(DEFAULT_DATA.accessories)),App.state=e,await AppStorage.saveState(e),document.documentElement.setAttribute(`data-theme`,e.ui.theme||`light`),document.getElementById(`lang-toggle`).addEventListener(`click`,App.toggleLang),document.getElementById(`theme-toggle`).addEventListener(`click`,App.toggleTheme),document.getElementById(`login-btn`).addEventListener(`click`,c),document.getElementById(`logout-btn`).addEventListener(`click`,w);let t=document.getElementById(`global-logout-btn`);t&&t.addEventListener(`click`,App.logout),document.getElementById(`login-submit`).addEventListener(`click`,C),document.getElementById(`admin-save-btn`).addEventListener(`click`,T),document.getElementById(`admin-reset-btn`).addEventListener(`click`,E),document.getElementById(`admin-add-btn`).addEventListener(`click`,h),document.getElementById(`admin-group`).addEventListener(`change`,e=>{n=e.target.value,p()}),document.getElementById(`admin-tbody`).addEventListener(`input`,y),document.getElementById(`admin-tbody`).addEventListener(`click`,b),document.getElementById(`home-link`).href=`index.html`,s(),u();let r=document.getElementById(`login-modal`);window.addEventListener(`click`,e=>{e.target===r&&l()}),document.getElementById(`login-pass`).addEventListener(`keydown`,e=>{e.key===`Enter`&&C()}),n=`UIR`,document.getElementById(`admin-group`).value=n,p(),S()}D()})();