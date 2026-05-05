(function () {
  let state;
  let loggedIn = false;
  let selectedGroup = "UIR";
  let isEditMode = false;
  let saveTimer = null;
  // Track IDs that were explicitly deleted during this session
  let deletedIds = { led_models: [], controllers: [], accessories: [] };

  function data() {
    return state.masterData;
  }
  function group() {
    return data()[selectedGroup];
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function setStaticTexts() {
    document.title = App.t("adminTitle");
    document.getElementById("admin-title").textContent = App.t("adminTitle");
    document.getElementById("admin-subtitle").textContent = App.t("adminSub");
    document.getElementById("admin-group-label").textContent =
      App.t("targetGroup");
    App.applyLanguage();
  }

  function updateLoginUI() {
    App.renderWelcomeBanner();

    document.getElementById("admin-panel").style.display = "block";
    document.getElementById("admin-add-btn").style.display = isEditMode ? "inline-block" : "none";
    document.getElementById("admin-import-btn").style.display = isEditMode ? "inline-block" : "none";
    document.getElementById("admin-clear-btn").style.display = isEditMode ? "inline-block" : "none";
    document.getElementById("admin-save-btn").style.display = isEditMode ? "inline-block" : "none";
    
    document.getElementById("admin-group").value = selectedGroup;
    renderTable();
  }

  async function persist() {
    await AppStorage.saveState(state);
    const result = await App.syncToDB(deletedIds);
    if (result && result.success) {
      deletedIds = { led_models: [], controllers: [], accessories: [] };
    }
    return result;
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await AppStorage.saveState(state);
    }, 250);
  }

  async function refreshData() {
    if (isEditMode && !confirm("⚠️ ข้อมูลที่คุณกำลังแก้ไขแต่ยังไม่ได้บันทึกจะหายไป ต้องการรีเฟรชหรือไม่?")) return;
    App.showToast("🔄 กำลังดึงข้อมูลล่าสุด...");
    try {
      const success = await App.syncFromDB();
      if (success) {
        state.masterData = App.state.masterData;
        deletedIds = { led_models: [], controllers: [], accessories: [] };
        renderTable();
        App.showToast("✅ ข้อมูลเป็นปัจจุบันแล้ว");
      }
    } catch (err) {
      App.showToast("❌ โหลดข้อมูลไม่สำเร็จ");
    }
  }

  function exportTable(format = "tsv", download = false) {
    let rows = [];
    const thead = document.getElementById("admin-thead");
    const tbody = document.getElementById("admin-tbody");
    
    const headers = Array.from(thead.querySelectorAll("th"))
      .slice(1, -1)
      .map(th => th.textContent.trim());
    rows.push(headers);

    Array.from(tbody.querySelectorAll("tr")).forEach(tr => {
      const rowData = Array.from(tr.querySelectorAll("input"))
        .map(input => input.value.trim());
      rows.push(rowData);
    });

    let content = "";
    let delimiter = (format === "excel" || format === "tsv") ? "\t" : ",";
    
    if (format === "csv") {
        content = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    } else {
        content = rows.map(r => r.join(delimiter)).join("\n");
    }

    if (download) {
      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `razr_led_${selectedGroup}_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      App.showToast("📥 เริ่มการดาวน์โหลดไฟล์...");
    } else {
      navigator.clipboard.writeText(content).then(() => {
        App.showToast(`📋 คัดลอกตาราง (${format.toUpperCase()}) เรียบร้อย`);
      });
    }
  }

  function renderTable() {
    const thead = document.getElementById("admin-thead");
    const tbody = document.getElementById("admin-tbody");

    if (selectedGroup === "controllers") {
      thead.innerHTML = `
        <tr>
          <th style="width:40px;"></th>
          <th>${App.t("controllerName")}</th>
          <th>${App.t("load")}</th>
          <th>${App.t("price")}</th>
          <th>${App.t("manage")}</th>
        </tr>`;
      tbody.innerHTML = data().controllers.map((it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="controller" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="controller" data-field="load" data-index="${idx}" type="number" value="${it.load}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="controller" data-field="price" data-index="${idx}" type="number" value="${it.price}" ${!isEditMode ? "disabled" : ""}></td>
          <td>${isEditMode ? `<button class="mini-btn delete" data-action="delete-controller" data-index="${idx}">${App.t("delete")}</button>` : "-"}</td>
        </tr>`).join("");
    } else if (selectedGroup === "accessories") {
      thead.innerHTML = `
        <tr>
          <th style="width:40px;"></th>
          <th>${App.t("accName")}</th>
          <th>${App.t("price")}</th>
          <th>${App.t("manage")}</th>
        </tr>`;
      tbody.innerHTML = (data().accessories || []).map((it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="accessory" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="accessory" data-field="price" data-index="${idx}" type="number" value="${it.price}" ${!isEditMode ? "disabled" : ""}></td>
          <td>${isEditMode ? `<button class="mini-btn delete" data-action="delete-accessory" data-index="${idx}">${App.t("delete")}</button>` : "-"}</td>
        </tr>`).join("");
    } else {
      const items = group().items;
      thead.innerHTML = `
        <tr>
          <th style="width:40px;"></th>
          <th>${App.t("name")}</th>
          <th>Price /sqm</th><th>RW</th><th>RH</th><th>Max W</th><th>Avg W</th>
          <th>Module Size</th><th>Cab. Res</th><th>Modules/Cab</th><th>Weight kg</th>
          <th>Brightness</th><th>Refresh</th><th>Material</th><th>Maintenance</th>
          <th>Ingress</th><th>LED Type</th><th>Beam Angle</th><th>Color Temp</th>
          <th>Grayscale</th><th>Life Hours</th><th>Frame Rate</th><th>Display Type</th>
          <th>Contrast</th><th>Working Temp</th><th>Humidity</th><th>Status</th>
          <th>${App.t("manage")}</th>
        </tr>`;
      tbody.innerHTML = items.map((it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="item" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="price" data-index="${idx}" type="number" value="${it.price || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="rw" data-index="${idx}" type="number" value="${it.rw || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="rh" data-index="${idx}" type="number" value="${it.rh || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="max" data-index="${idx}" type="number" value="${it.max || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="avg" data-index="${idx}" type="number" value="${it.avg || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="module_size" data-index="${idx}" type="text" value="${escapeHtml(it.module_size || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="cabinet_resolution" data-index="${idx}" type="text" value="${escapeHtml(it.cabinet_resolution || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="modules_per_cabinet" data-index="${idx}" type="number" value="${it.modules_per_cabinet || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="weight_kg" data-index="${idx}" type="number" step="0.1" value="${it.weight_kg || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="brightness" data-index="${idx}" type="number" value="${it.brightness || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="refresh_rate" data-index="${idx}" type="number" value="${it.refresh_rate || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="material" data-index="${idx}" type="text" value="${escapeHtml(it.material || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="maintenance" data-index="${idx}" type="text" value="${escapeHtml(it.maintenance || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="ingress_protection" data-index="${idx}" type="text" value="${escapeHtml(it.ingress_protection || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="led_type" data-index="${idx}" type="text" value="${escapeHtml(it.led_type || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="beam_angle" data-index="${idx}" type="text" value="${escapeHtml(it.beam_angle || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="color_temperature" data-index="${idx}" type="text" value="${escapeHtml(it.color_temperature || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="processing_depth" data-index="${idx}" type="text" value="${escapeHtml(it.processing_depth || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="life_hours" data-index="${idx}" type="number" value="${it.life_hours || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="video_support" data-index="${idx}" type="text" value="${escapeHtml(it.video_support || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="display_type" data-index="${idx}" type="text" value="${escapeHtml(it.display_type || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="contrast_ratio" data-index="${idx}" type="text" value="${escapeHtml(it.contrast_ratio || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="working_temp" data-index="${idx}" type="text" value="${escapeHtml(it.working_temp || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="humidity" data-index="${idx}" type="text" value="${escapeHtml(it.humidity || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="status_checking" data-index="${idx}" type="text" value="${escapeHtml(it.status_checking || "")}" ${!isEditMode ? "disabled" : ""}></td>
          <td>${isEditMode ? `<button class="mini-btn delete" data-action="delete-item" data-index="${idx}">${App.t("delete")}</button>` : "-"}</td>
        </tr>`).join("");
    }
  }

  function normalizeGroupKey() {
    if (selectedGroup !== "controllers" && selectedGroup !== "accessories" && !data()[selectedGroup]) selectedGroup = "UIR";
  }

  function addRow() {
    normalizeGroupKey();
    let addedName = "";
    if (selectedGroup === "controllers") {
      data().controllers.push({ name: "NEW", load: 1000000, price: 0 });
      addedName = "Controller";
    } else if (selectedGroup === "accessories") {
      if (!data().accessories) data().accessories = [];
      data().accessories.push({ name: "NEW ACCESSORY", price: 0 });
      addedName = "Accessory";
    } else {
      group().items.push({
        name: "NEW MODEL", rw: 0, rh: 0, max: 0, avg: 0, price: 0, brightness: 0, refresh_rate: 0, material: "", maintenance: "", ingress_protection: "", led_type: "", beam_angle: "", color_temperature: "", processing_depth: "", life_hours: 0, video_support: "", display_type: "", module_size: "", cabinet_resolution: "", modules_per_cabinet: 0, weight_kg: 0, contrast_ratio: "", working_temp: "", humidity: "", status_checking: ""
      });
      addedName = selectedGroup + " Model";
    }
    renderTable();
    scheduleSave();
    App.showToast(`✅ เพิ่มแถวใหม่ (${addedName}) เรียบร้อย`);
  }

  function deleteItem(idx) {
    const item = group().items[idx];
    if (!item) return;
    if (!confirm(`⚠️ คุณต้องการลบ "${item.name}" ใช่หรือไม่?`)) return;
    if (item.id) deletedIds.led_models.push(item.id);
    group().items.splice(idx, 1);
    renderTable();
    scheduleSave();
    App.showToast(`🗑️ ลบแล้ว`);
  }

  function deleteController(idx) {
    const item = data().controllers[idx];
    if (!item) return;
    if (!confirm(`⚠️ คุณต้องการลบ "${item.name}" ใช่หรือไม่?`)) return;
    if (item.id) deletedIds.controllers.push(item.id);
    data().controllers.splice(idx, 1);
    renderTable();
    scheduleSave();
    App.showToast(`🗑️ ลบแล้ว`);
  }

  function deleteAccessory(idx) {
    const item = data().accessories?.[idx];
    if (!item) return;
    if (!confirm(`⚠️ คุณต้องการลบ "${item.name}" ใช่หรือไม่?`)) return;
    if (item.id) deletedIds.accessories.push(item.id);
    data().accessories.splice(idx, 1);
    renderTable();
    scheduleSave();
    App.showToast(`🗑️ ลบแล้ว`);
  }

  function handleTableInput(e) {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    const index = Number(el.dataset.index);
    const field = el.dataset.field;
    const kind = el.dataset.kind;
    if (!field || Number.isNaN(index)) return;

    const textFields = ["name", "material", "maintenance", "ingress_protection", "led_type", "beam_angle", "color_temperature", "processing_depth", "video_support", "display_type", "module_size", "cabinet_resolution", "contrast_ratio", "working_temp", "humidity", "status_checking"];
    const isTextField = textFields.includes(field);

    if (kind === "item" && group().items[index]) {
      group().items[index][field] = isTextField ? el.value : Number(el.value || 0);
    } else if (kind === "controller" && data().controllers[index]) {
      data().controllers[index][field] = isTextField ? el.value : Number(el.value || 0);
    } else if (kind === "accessory" && data().accessories[index]) {
      data().accessories[index][field] = isTextField ? el.value : Number(el.value || 0);
    }
    scheduleSave();
  }

  function handleTableAction(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const idx = Number(btn.dataset.index);
    const action = btn.dataset.action;
    if (action === "delete-item") deleteItem(idx);
    if (action === "delete-controller") deleteController(idx);
    if (action === "delete-accessory") deleteAccessory(idx);
  }

  function initDragDrop() {
    const tbody = document.getElementById("admin-tbody");
    let draggedIndex = null;
    tbody.addEventListener("dragstart", (e) => {
      const tr = e.target.closest("tr");
      if (!tr) return;
      draggedIndex = Number(tr.dataset.index);
      e.dataTransfer.effectAllowed = "move";
    });
    tbody.addEventListener("dragover", (e) => e.preventDefault());
    tbody.addEventListener("drop", (e) => {
      e.preventDefault();
      const tr = e.target.closest("tr");
      if (!tr) return;
      const targetIndex = Number(tr.dataset.index);
      if (draggedIndex === null || targetIndex === draggedIndex) return;
      let arr = (selectedGroup === "controllers") ? data().controllers : (selectedGroup === "accessories" ? data().accessories : group().items);
      const item = arr.splice(draggedIndex, 1)[0];
      arr.splice(targetIndex, 0, item);
      renderTable();
      scheduleSave();
    });
  }

  async function logout() { App.logout(); }

  async function saveAll() {
    const result = await persist();
    if (result && result.success) App.showToast(App.t("saved"));
    else alert("❌ ไม่สามารถบันทึกได้! กรุณาตรวจสอบ RLS ใน Supabase");
  }

  function toggleEditMode() {
    isEditMode = !isEditMode;
    const toggleBtn = document.getElementById("admin-edit-toggle-btn");
    const ids = ["admin-save-btn", "admin-add-btn", "admin-import-btn", "admin-clear-btn"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = isEditMode ? "inline-block" : "none";
    });
    toggleBtn.innerHTML = isEditMode ? "🏁 เสร็จสิ้น" : "🔓 แก้ไขข้อมูล";
    renderTable();
  }

  async function clearCurrentTable() {
    if (!confirm("⚠️ ล้างข้อมูลทั้งหมดในตารางนี้?")) return;
    if (selectedGroup === "controllers") state.masterData.controllers = [];
    else if (selectedGroup === "accessories") state.masterData.accessories = [];
    else group().items = [];
    renderTable();
  }

  function openImport() {
    document.getElementById("import-area").value = "";
    document.getElementById("import-modal").style.display = "flex";
  }
  function closeImport() { document.getElementById("import-modal").style.display = "none"; }

  function cleanNum(str) {
    return parseFloat(String(str || "0").replace(/,/g, "").replace(/\s/g, "").replace(/[฿$]/g, "")) || 0;
  }

  function handleImportInput() {
    const raw = document.getElementById("import-area").value.trim();
    if (!raw) return;
    const lines = raw.split("\n");
    const thead = document.getElementById("import-preview-thead");
    const tbody = document.getElementById("import-preview-tbody");
    thead.innerHTML = document.getElementById("admin-thead").innerHTML;
    const headColCount = thead.querySelectorAll("th").length;
    tbody.innerHTML = lines.map(line => {
      const cols = line.split("\t").map(s => s.trim());
      let rowHtml = "<td>-</td>";
      for(let i=0; i < headColCount - 2; i++) rowHtml += `<td>${escapeHtml(cols[i] || "")}</td>`;
      rowHtml += "<td>(Auto)</td>";
      return `<tr>${rowHtml}</tr>`;
    }).join("");
    document.getElementById("import-preview-container").style.display = "block";
    document.getElementById("import-confirm-btn").disabled = false;
  }

  function processImport() {
    const lines = document.getElementById("import-area").value.trim().split("\n");
    lines.forEach(line => {
      const cols = line.split("\t").map(s => s.trim());
      if (cols.length < 2) return;
      if (selectedGroup === "controllers") data().controllers.push({ name: cols[0], load: cleanNum(cols[1]), price: cleanNum(cols[2]) });
      else if (selectedGroup === "accessories") data().accessories.push({ name: cols[0], price: cleanNum(cols[1]) });
      else group().items.push({ name: cols[0], price: cleanNum(cols[1]), rw: cleanNum(cols[2]), rh: cleanNum(cols[3]), max: cleanNum(cols[4]), avg: cleanNum(cols[5]), module_size: cols[6]||"", cabinet_resolution: cols[7]||"", modules_per_cabinet: cleanNum(cols[8]), weight_kg: cleanNum(cols[9]), brightness: cleanNum(cols[10]), refresh_rate: cleanNum(cols[11]), material: cols[12]||"", maintenance: cols[13]||"", ingress_protection: cols[14]||"", led_type: cols[15]||"", beam_angle: cols[16]||"", color_temperature: cols[17]||"", processing_depth: cols[18]||"", life_hours: cleanNum(cols[19]), video_support: cols[20]||"", display_type: cols[21]||"", contrast_ratio: cols[22]||"", working_temp: cols[23]||"", humidity: cols[24]||"", status_checking: cols[25]||"" });
    });
    renderTable();
    closeImport();
    App.showToast("📊 นำเข้าเรียบร้อย");
  }

  async function boot() {
    await App.checkAuth();
    state = await AppStorage.loadState();
    state.masterData = App.clone(window.DEFAULT_DATA);
    App.state = state;
    try {
      const success = await App.syncFromDB();
      if (success) state.masterData = App.state.masterData;
    } catch(e) {}
    renderTable();
    initDragDrop();
    document.getElementById("admin-refresh-btn").addEventListener("click", refreshData);
    document.getElementById("copy-data-btn").addEventListener("click", () => exportTable("tsv"));
    document.getElementById("copy-excel-btn").addEventListener("click", () => exportTable("excel"));
    document.getElementById("download-csv-btn").addEventListener("click", () => exportTable("csv", true));
    document.getElementById("admin-save-btn").addEventListener("click", saveAll);
    document.getElementById("admin-edit-toggle-btn").addEventListener("click", toggleEditMode);
    document.getElementById("admin-add-btn").addEventListener("click", addRow);
    document.getElementById("admin-import-btn").addEventListener("click", openImport);
    document.getElementById("admin-clear-btn").addEventListener("click", clearCurrentTable);
    document.getElementById("import-confirm-btn").addEventListener("click", processImport);
    document.getElementById("import-cancel-btn").addEventListener("click", closeImport);
    document.getElementById("import-area").addEventListener("input", handleImportInput);
    document.getElementById("admin-group").addEventListener("change", (e) => { selectedGroup = e.target.value; renderTable(); });
    document.getElementById("admin-tbody").addEventListener("input", handleTableInput);
    document.getElementById("admin-tbody").addEventListener("click", handleTableAction);
  }

  waitForDeps();
  function waitForDeps() {
    if (typeof App !== "undefined" && typeof AppStorage !== "undefined") boot();
    else setTimeout(waitForDeps, 50);
  }
})();
