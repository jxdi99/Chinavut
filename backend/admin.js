(function () {
  let state;
  let loggedIn = false;
  let selectedGroup = "UIR";
  let isEditMode = false;
  let saveTimer = null;

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
    return await App.syncToDB();
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await AppStorage.saveState(state);
    }, 250);
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
      tbody.innerHTML = data()
        .controllers.map(
          (it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="controller" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="controller" data-field="load" data-index="${idx}" type="number" value="${it.load}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="controller" data-field="price" data-index="${idx}" type="number" value="${it.price}" ${!isEditMode ? "disabled" : ""}></td>
          <td>
            ${isEditMode ? `<button class="mini-btn delete" data-action="delete-controller" data-index="${idx}">${App.t("delete")}</button>` : "-"}
          </td>
        </tr>
      `,
        )
        .join("");
    } else if (selectedGroup === "accessories") {
      thead.innerHTML = `
        <tr>
          <th style="width:40px;"></th>
          <th>${App.t("accName")}</th>
          <th>${App.t("price")}</th>
          <th>${App.t("manage")}</th>
        </tr>`;
      tbody.innerHTML = (data().accessories || [])
        .map(
          (it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="accessory" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="accessory" data-field="price" data-index="${idx}" type="number" value="${it.price}" ${!isEditMode ? "disabled" : ""}></td>
          <td>
            ${isEditMode ? `<button class="mini-btn delete" data-action="delete-accessory" data-index="${idx}">${App.t("delete")}</button>` : "-"}
          </td>
        </tr>
      `,
        )
        .join("");
    } else {
      const items = group().items;
      thead.innerHTML = `
        <tr>
          <th style="width:40px;"></th>
          <th>${App.t("name")}</th>
          <th>Price /sqm</th>
          <th>RW</th>
          <th>RH</th>
          <th>Max W</th>
          <th>Avg W</th>
          <th>Module Size</th>
          <th>Cab. Res</th>
          <th>Modules/Cab</th>
          <th>Weight kg</th>
          <th>Brightness</th>
          <th>Refresh</th>
          <th>Material</th>
          <th>Maintenance</th>
          <th>Ingress</th>
          <th>LED Type</th>
          <th>Beam Angle</th>
          <th>Color Temp</th>
          <th>Grayscale</th>
          <th>Life Hours</th>
          <th>Frame Rate</th>
          <th>Display Type</th>
          <th>Contrast</th>
          <th>Working Temp</th>
          <th>Humidity</th>
          <th>Status</th>
          <th>${App.t("manage")}</th>
        </tr>`;
      tbody.innerHTML = items
        .map(
          (it, idx) => `
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
          <td>
            ${isEditMode ? `<button class="mini-btn delete" data-action="delete-item" data-index="${idx}">${App.t("delete")}</button>` : "-"}
          </td>
        </tr>
      `,
        )
        .join("");
    }
  }

  function normalizeGroupKey() {
    if (
      selectedGroup !== "controllers" &&
      selectedGroup !== "accessories" &&
      !data()[selectedGroup]
    )
      selectedGroup = "UIR";
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
        name: "NEW MODEL",
        rw: 0,
        rh: 0,
        max: 0,
        avg: 0,
        price: 0,
        brightness: 0,
        refresh_rate: 0,
        material: "",
        maintenance: "",
        ingress_protection: "",
        led_type: "",
        beam_angle: "",
        color_temperature: "",
        processing_depth: "",
        life_hours: 0,
        video_support: "",
        display_type: "",
        // New
        module_size: "",
        cabinet_resolution: "",
        modules_per_cabinet: 0,
        weight_kg: 0,
        contrast_ratio: "",
        working_temp: "",
        humidity: "",
        status_checking: ""
      });
      addedName = selectedGroup + " Model";
    }
    renderTable();
    scheduleSave();
    App.showToast(`✅ เพิ่มแถวใหม่ (${addedName}) เรียบร้อย`);
  }

  function deleteItem(idx) {
    const itemName = group().items[idx]?.name || "รายการนี้";
    if (!confirm(`⚠️ คุณต้องการลบ "${itemName}" ใช่หรือไม่?\n\n(ข้อมูลจะถูกลบออกจากตาราง กดบันทึกทั้งหมดเพื่อยืนยัน)`)) return;
    group().items.splice(idx, 1);
    renderTable();
    scheduleSave();
    App.showToast(`🗑️ ลบ "${itemName}" แล้ว`);
  }

  function deleteController(idx) {
    const itemName = data().controllers[idx]?.name || "Controller นี้";
    if (!confirm(`⚠️ คุณต้องการลบ "${itemName}" ใช่หรือไม่?\n\n(กดบันทึกทั้งหมดเพื่อยืนยัน)`)) return;
    data().controllers.splice(idx, 1);
    renderTable();
    scheduleSave();
    App.showToast(`🗑️ ลบ "${itemName}" แล้ว`);
  }

  function deleteAccessory(idx) {
    const itemName = data().accessories?.[idx]?.name || "อุปกรณ์เสริมนี้";
    if (!confirm(`⚠️ คุณต้องการลบ "${itemName}" ใช่หรือไม่?\n\n(กดบันทึกทั้งหมดเพื่อยืนยัน)`)) return;
    if (data().accessories) data().accessories.splice(idx, 1);
    renderTable();
    scheduleSave();
    App.showToast(`🗑️ ลบ "${itemName}" แล้ว`);
  }

  function handleTableInput(e) {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    const index = Number(el.dataset.index);
    const field = el.dataset.field;
    const kind = el.dataset.kind;
    if (!field || Number.isNaN(index)) return;

    // Fields that should be stored as text
    const textFields = [
      "name",
      "material",
      "maintenance",
      "ingress_protection",
      "led_type",
      "beam_angle",
      "color_temperature",
      "processing_depth",
      "video_support",
      "display_type",
      "module_size",
      "cabinet_resolution",
      "contrast_ratio",
      "working_temp",
      "humidity",
      "status_checking",
    ];
    const isTextField = textFields.includes(field);

    if (kind === "item" && group().items[index]) {
      group().items[index][field] = isTextField
        ? el.value
        : Number(el.value || 0);
    } else if (kind === "controller" && data().controllers[index]) {
      data().controllers[index][field] = isTextField
        ? el.value
        : Number(el.value || 0);
    } else if (kind === "accessory" && data().accessories[index]) {
      data().accessories[index][field] = isTextField
        ? el.value
        : Number(el.value || 0);
    }
    scheduleSave();
    // Debounce edit toast so it doesn't spam
    clearTimeout(window._editToastTimer);
    window._editToastTimer = setTimeout(() => {
      App.showToast(`✏️ แก้ไขข้อมูลเรียบร้อย (กดบันทึกทั้งหมดเพื่ออัปเดต Database)`);
    }, 1000);
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

  let draggedIndex = null;
  function initDragDrop() {
    const tbody = document.getElementById("admin-tbody");

    tbody.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("drag-handle")) {
        const tr = e.target.closest("tr");
        if (tr) tr.setAttribute("draggable", "true");
      }
    });

    tbody.addEventListener("mouseup", (e) => {
      const tr = e.target.closest("tr");
      if (tr && tr.hasAttribute("draggable")) tr.removeAttribute("draggable");
    });

    tbody.addEventListener("dragstart", (e) => {
      const tr = e.target.closest("tr");
      if (!tr) return;
      draggedIndex = Number(tr.dataset.index);
      e.dataTransfer.effectAllowed = "move";
      tr.style.opacity = "0.6";
    });

    tbody.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const tr = e.target.closest("tr");
      if (tr && Number(tr.dataset.index) !== draggedIndex) {
        tr.style.borderTop = "3px solid var(--primary)";
      }
    });

    tbody.addEventListener("dragleave", (e) => {
      const tr = e.target.closest("tr");
      if (tr) tr.style.borderTop = "";
    });

    tbody.addEventListener("drop", (e) => {
      e.preventDefault();
      const tr = e.target.closest("tr");
      if (!tr) return;
      tr.style.borderTop = "";

      const targetIndex = Number(tr.dataset.index);
      if (draggedIndex === null || targetIndex === draggedIndex) return;

      let arr;
      if (selectedGroup === "controllers") {
        arr = data().controllers;
      } else if (selectedGroup === "accessories") {
        arr = data().accessories;
      } else {
        arr = group().items;
      }
      const item = arr.splice(draggedIndex, 1)[0];
      arr.splice(targetIndex, 0, item);

      renderTable();
      scheduleSave();
    });

    tbody.addEventListener("dragend", (e) => {
      const tr = e.target.closest("tr");
      if (tr) {
        tr.style.opacity = "1";
        tr.removeAttribute("draggable");
      }
      Array.from(tbody.querySelectorAll("tr")).forEach(
        (r) => (r.style.borderTop = ""),
      );
      draggedIndex = null;
    });
  }

  async function logout() {
    App.logout();
  }

  async function saveAll() {
    const result = await persist();
    if (result && result.success) {
      App.showToast(App.t("saved"));
    } else {
      const errMsg = result?.error ? `\n\n[ข้อผิดพลาดจากระบบ: ${result.error}]` : "";
      alert(`❌ ไม่สามารถบันทึกได้! สาเหตุหลักคือ:\n\n1. คุณลืมปิด RLS (Row Level Security) ใน Supabase\n2. ไปที่ Supabase -> Table Editor -> ปิด RLS ของตาราง led_models, controllers, accessories ให้เป็นสีเทา\n\nถ้าปิดแล้วจะบันทึกได้ทันทีครับ!${errMsg}`);
    }
  }



  function toggleEditMode() {
    isEditMode = !isEditMode;
    const toggleBtn = document.getElementById("admin-edit-toggle-btn");
    const saveBtn = document.getElementById("admin-save-btn");
    const addBtn = document.getElementById("admin-add-btn");
    const importBtn = document.getElementById("admin-import-btn");
    const clearBtn = document.getElementById("admin-clear-btn");

    if (isEditMode) {
      document.body.classList.add("edit-mode-active");
      toggleBtn.innerHTML = "🏁 เสร็จสิ้น / ยกเลิก";
      toggleBtn.classList.replace("btn-primary", "btn-secondary");
      if (saveBtn) saveBtn.style.display = "inline-block";
      if (addBtn) addBtn.style.display = "inline-block";
      if (importBtn) importBtn.style.display = "inline-block";
      if (clearBtn) clearBtn.style.display = "inline-block";
      App.showToast("🔓 เปิดโหมดแก้ไขแล้ว");
    } else {
      document.body.classList.remove("edit-mode-active");
      toggleBtn.innerHTML = "🔓 แก้ไขข้อมูล";
      toggleBtn.classList.replace("btn-secondary", "btn-primary");
      if (saveBtn) saveBtn.style.display = "none";
      if (addBtn) addBtn.style.display = "none";
      if (importBtn) importBtn.style.display = "none";
      if (clearBtn) clearBtn.style.display = "none";
      App.showToast("🔒 ปิดโหมดแก้ไข");
      // Re-load data from state to undo unsaved changes
      renderTable();
    }
    renderTable();
  }

  async function clearCurrentTable() {
    if (!confirm("⚠️ คุณแน่ใจหรือไม่ที่จะลบข้อมูลทั้งหมดในตารางนี้?")) return;
    
    if (selectedGroup === "controllers") {
      state.masterData.controllers = [];
    } else if (selectedGroup === "accessories") {
      state.masterData.accessories = [];
    } else {
      group().items = [];
    }
    
    renderTable();
    App.showToast("🗑️ ล้างข้อมูลในตารางเรียบร้อย");
  }

  function openImport() {
    document.getElementById("import-area").value = "";
    document.getElementById("import-preview-container").style.display = "none";
    document.getElementById("import-confirm-btn").disabled = true;
    document.getElementById("import-modal").style.display = "flex";
  }

  function closeImport() {
    document.getElementById("import-modal").style.display = "none";
  }

  function cleanNum(str) {
    if (str === null || str === undefined || str === "") return 0;
    // Remove commas, spaces, and any currency symbols, then parse
    const cleaned = String(str).replace(/,/g, "").replace(/\s/g, "").replace(/[฿$]/g, "");
    return parseFloat(cleaned) || 0;
  }

  function handleImportInput() {
    const raw = document.getElementById("import-area").value.trim();
    const container = document.getElementById("import-preview-container");
    const confirmBtn = document.getElementById("import-confirm-btn");
    const thead = document.getElementById("import-preview-thead");
    const tbody = document.getElementById("import-preview-tbody");

    if (!raw) {
      container.style.display = "none";
      confirmBtn.disabled = true;
      return;
    }

    const lines = raw.split("\n");
    if (lines.length === 0) return;

    // Use current group's headers for preview
    const mainThead = document.getElementById("admin-thead");
    thead.innerHTML = mainThead.innerHTML;
    
    const headColCount = mainThead.querySelectorAll("th").length;

    tbody.innerHTML = lines
      .map((line) => {
        const cols = line.split("\t").map((s) => s.trim());
        // Pad or truncate to match header count (Handle + data + Manage)
        // Data usually starts at index 1 in main table (0 is Handle)
        let rowHtml = "<td>-</td>"; 
        for(let i=0; i < headColCount - 2; i++) {
            rowHtml += `<td>${escapeHtml(cols[i] || "")}</td>`;
        }
        rowHtml += "<td>(Auto)</td>"; // Manage column
        return `<tr>${rowHtml}</tr>`;
      })
      .join("");

    container.style.display = "block";
    confirmBtn.disabled = false;
  }

  function processImport() {
    const raw = document.getElementById("import-area").value.trim();
    if (!raw) return;

    const lines = raw.split("\n");
    let count = 0;

    lines.forEach((line) => {
      const cols = line.split("\t").map((s) => s.trim());
      if (cols.length < 2) return;

      if (selectedGroup === "controllers") {
        data().controllers.push({
          name: cols[0],
          load: cleanNum(cols[1]),
          price: cleanNum(cols[2]),
        });
      } else if (selectedGroup === "accessories") {
        data().accessories.push({
          name: cols[0],
          price: cleanNum(cols[1]),
        });
      } else {
        group().items.push({
          name: cols[0],
          rw: cleanNum(cols[1]),
          rh: cleanNum(cols[2]),
          max: cleanNum(cols[3]),
          avg: cleanNum(cols[4]),
          price: cleanNum(cols[5]),
          brightness: cleanNum(cols[6]),
          refresh_rate: cleanNum(cols[7]),
          material: cols[8] || "",
          maintenance: cols[9] || "",
          ingress_protection: cols[10] || "",
          led_type: cols[11] || "",
          beam_angle: cols[12] || "",
          color_temperature: cols[13] || "",
          processing_depth: cols[14] || "",
          life_hours: cleanNum(cols[15]),
          video_support: cols[16] || "",
          display_type: cols[17] || "",
          // New
          module_size: cols[18] || "",
          cabinet_resolution: cols[19] || "",
          modules_per_cabinet: cleanNum(cols[20]),
          weight_kg: cleanNum(cols[21]),
          contrast_ratio: cols[22] || "",
          working_temp: cols[23] || "",
          humidity: cols[24] || "",
          status_checking: cols[25] || ""
        });
      }
      count++;
    });

    if (count > 0) {
      renderTable();
      closeImport();
      App.showToast(`📊 นำเข้าข้อมูล ${count} แถว เรียบร้อย (อย่าลืมกดบันทึก)`);
    } else {
      alert("ไม่พบข้อมูลที่ถูกต้อง (ตรวจสอบว่าคั่นด้วย Tab หรือไม่)");
    }
  }

  async function boot() {
    await App.checkAuth();
    state = await AppStorage.loadState();
    state.ui = state.ui || { theme: "light", lang: "th" };

    // === ดึงข้อมูลจาก Database เป็นหลัก 100% ===
    // เริ่มต้นด้วยข้อมูลจาก DEFAULT_DATA ในโค้ดก่อน
    state.masterData = App.clone(window.DEFAULT_DATA);
    App.state = state;

    try {
      const syncSuccess = await App.syncFromDB();
      if (syncSuccess) {
        state.masterData = App.state.masterData;
        App.showToast("✅ โหลดข้อมูลจาก Database เรียบร้อย");
      } else {
        console.warn("Supabase sync returned false.");
        App.showToast("⚠️ ไม่สามารถดึงข้อมูลจาก Database ได้ (ตารางอาจว่างเปล่า)");
      }
    } catch (err) {
      console.error("Supabase sync exception:", err);
      App.showToast("❌ เชื่อมต่อ Database ไม่ได้");
    }

    await AppStorage.saveState(state);

    document.documentElement.setAttribute(
      "data-theme",
      state.ui.theme || "light",
    );

    const langToggle = document.getElementById("lang-toggle");
    if (langToggle) langToggle.addEventListener("click", App.toggleLang);

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) themeToggle.addEventListener("click", App.toggleTheme);

    const logoutBtn = document.getElementById("admin-logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    const globalLogout = document.getElementById("global-logout-btn");
    if (globalLogout) globalLogout.addEventListener("click", App.logout);

    // Removed doLogin

    const saveBtn = document.getElementById("admin-save-btn");
    if (saveBtn) saveBtn.addEventListener("click", saveAll);

    const clearBtn = document.getElementById("admin-clear-btn");
    if (clearBtn) clearBtn.addEventListener("click", clearCurrentTable);


    const editToggleBtn = document.getElementById("admin-edit-toggle-btn");
    if (editToggleBtn) editToggleBtn.addEventListener("click", toggleEditMode);

    const addBtn = document.getElementById("admin-add-btn");
    if (addBtn) addBtn.addEventListener("click", addRow);

    const importBtn = document.getElementById("admin-import-btn");
    if (importBtn) importBtn.addEventListener("click", openImport);

    const importCancel = document.getElementById("import-cancel-btn");
    if (importCancel) importCancel.addEventListener("click", closeImport);

    const importConfirm = document.getElementById("import-confirm-btn");
    if (importConfirm) importConfirm.addEventListener("click", processImport);

    const importArea = document.getElementById("import-area");
    if (importArea) importArea.addEventListener("input", handleImportInput);

    const groupSelect = document.getElementById("admin-group");
    if (groupSelect)
      groupSelect.addEventListener("change", (e) => {
        selectedGroup = e.target.value;
        renderTable();
      });

    const tbody = document.getElementById("admin-tbody");
    if (tbody) {
      tbody.addEventListener("input", handleTableInput);
      tbody.addEventListener("click", handleTableAction);
    }

    const homeLink = document.getElementById("home-link");
    if (homeLink) homeLink.href = "../dashboard.html";

    setStaticTexts();
    updateLoginUI();

    // Modal removed

    const adminGroup = document.getElementById("admin-group");
    if (adminGroup) {
      selectedGroup = "UIR";
      adminGroup.value = selectedGroup;
    }

    renderTable();
    initDragDrop();
  }

  // Wait for App and AppStorage to be ready
  function waitForDeps() {
    if (typeof App !== "undefined" && typeof AppStorage !== "undefined") {
      boot();
    } else {
      setTimeout(waitForDeps, 50);
    }
  }

  waitForDeps();
})();
