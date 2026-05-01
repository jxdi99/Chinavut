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
          <th>RW</th>
          <th>RH</th>
          <th>Max W</th>
          <th>Avg W</th>
          <th>${App.t("pricePerCab")}</th>
          <th>Brightness</th>
          <th>Refresh</th>
          <th>Material</th>
          <th>Maintenance</th>
          <th>Ingress</th>
          <th>LED Type</th>
          <th>Beam Angle</th>
          <th>Color Temp</th>
          <th>Processing</th>
          <th>Life Hours</th>
          <th>Video Support</th>
          <th>Display Type</th>
          <th>${App.t("manage")}</th>
        </tr>`;
      tbody.innerHTML = items
        .map(
          (it, idx) => `
        <tr data-index="${idx}">
          <td class="drag-handle" style="cursor:grab; text-align:center; font-size:1.2rem; color:var(--muted); user-select:none;">☰</td>
          <td><input data-kind="item" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="rw" data-index="${idx}" type="number" value="${it.rw || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="rh" data-index="${idx}" type="number" value="${it.rh || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="max" data-index="${idx}" type="number" value="${it.max || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="avg" data-index="${idx}" type="number" value="${it.avg || 0}" ${!isEditMode ? "disabled" : ""}></td>
          <td><input data-kind="item" data-field="price" data-index="${idx}" type="number" value="${it.price || 0}" ${!isEditMode ? "disabled" : ""}></td>
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

    if (isEditMode) {
      document.body.classList.add("edit-mode-active");
      toggleBtn.innerHTML = "🏁 เสร็จสิ้น / ยกเลิก";
      toggleBtn.classList.replace("btn-primary", "btn-secondary");
      if (saveBtn) saveBtn.style.display = "inline-block";
      if (addBtn) addBtn.style.display = "inline-block";
      App.showToast("🔓 เปิดโหมดแก้ไขแล้ว");
    } else {
      document.body.classList.remove("edit-mode-active");
      toggleBtn.innerHTML = "🔓 แก้ไขข้อมูล";
      toggleBtn.classList.replace("btn-secondary", "btn-primary");
      if (saveBtn) saveBtn.style.display = "none";
      if (addBtn) addBtn.style.display = "none";
      App.showToast("🔒 ปิดโหมดแก้ไข");
      // Re-load data from state to undo unsaved changes
      renderTable();
    }
    renderTable();
  }

  async function boot() {
    await App.checkAuth();
    state = await AppStorage.loadState();
    state.ui = state.ui || { theme: "light", lang: "th" };

    // === ดึงข้อมูลจาก Database เป็นหลัก 100% ===
    // เตรียมโครงสร้างว่างไว้ก่อน (ถ้า DB ว่าง จะแสดงตารางว่าง)
    const emptyData = {
      UIR: { w: 640, h: 480, weight: 7.8, type: "indoor", items: [] },
      UOS: { w: 960, h: 960, weight: 26.5, type: "outdoor", items: [] },
      CIH: { w: 600, h: 337.5, weight: 4.0, type: "indoor", items: [] },
      controllers: [],
      accessories: [],
    };
    state.masterData = emptyData;
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

    const editToggleBtn = document.getElementById("admin-edit-toggle-btn");
    if (editToggleBtn) editToggleBtn.addEventListener("click", toggleEditMode);

    const addBtn = document.getElementById("admin-add-btn");
    if (addBtn) addBtn.addEventListener("click", addRow);

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
