(function () {
  let state;
  let loggedIn = false;
  let selectedGroup = "UIR";
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
    document.getElementById("admin-add-btn").style.display = "inline-block";
    document.getElementById("admin-save-btn").style.display = "inline-block";
    document.getElementById("admin-reset-btn").style.display = "inline-block";
    
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
          <td><input data-kind="controller" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}"></td>
          <td><input data-kind="controller" data-field="load" data-index="${idx}" type="number" value="${it.load}"></td>
          <td><input data-kind="controller" data-field="price" data-index="${idx}" type="number" value="${it.price}"></td>
          <td>
            <button class="mini-btn delete" data-action="delete-controller" data-index="${idx}">${App.t("delete")}</button>
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
          <td><input data-kind="accessory" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}"></td>
          <td><input data-kind="accessory" data-field="price" data-index="${idx}" type="number" value="${it.price}"></td>
          <td>
            <button class="mini-btn delete" data-action="delete-accessory" data-index="${idx}">${App.t("delete")}</button>
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
          <td><input data-kind="item" data-field="name" data-index="${idx}" type="text" value="${escapeHtml(it.name)}"></td>
          <td><input data-kind="item" data-field="rw" data-index="${idx}" type="number" value="${it.rw || 0}"></td>
          <td><input data-kind="item" data-field="rh" data-index="${idx}" type="number" value="${it.rh || 0}"></td>
          <td><input data-kind="item" data-field="max" data-index="${idx}" type="number" value="${it.max || 0}"></td>
          <td><input data-kind="item" data-field="avg" data-index="${idx}" type="number" value="${it.avg || 0}"></td>
          <td><input data-kind="item" data-field="price" data-index="${idx}" type="number" value="${it.price || 0}"></td>
          <td><input data-kind="item" data-field="brightness" data-index="${idx}" type="number" value="${it.brightness || 0}"></td>
          <td><input data-kind="item" data-field="refresh_rate" data-index="${idx}" type="number" value="${it.refresh_rate || 0}"></td>
          <td><input data-kind="item" data-field="material" data-index="${idx}" type="text" value="${escapeHtml(it.material || "")}"></td>
          <td><input data-kind="item" data-field="maintenance" data-index="${idx}" type="text" value="${escapeHtml(it.maintenance || "")}"></td>
          <td><input data-kind="item" data-field="ingress_protection" data-index="${idx}" type="text" value="${escapeHtml(it.ingress_protection || "")}"></td>
          <td><input data-kind="item" data-field="led_type" data-index="${idx}" type="text" value="${escapeHtml(it.led_type || "")}"></td>
          <td><input data-kind="item" data-field="beam_angle" data-index="${idx}" type="text" value="${escapeHtml(it.beam_angle || "")}"></td>
          <td><input data-kind="item" data-field="color_temperature" data-index="${idx}" type="text" value="${escapeHtml(it.color_temperature || "")}"></td>
          <td><input data-kind="item" data-field="processing_depth" data-index="${idx}" type="text" value="${escapeHtml(it.processing_depth || "")}"></td>
          <td><input data-kind="item" data-field="life_hours" data-index="${idx}" type="number" value="${it.life_hours || 0}"></td>
          <td><input data-kind="item" data-field="video_support" data-index="${idx}" type="text" value="${escapeHtml(it.video_support || "")}"></td>
          <td><input data-kind="item" data-field="display_type" data-index="${idx}" type="text" value="${escapeHtml(it.display_type || "")}"></td>
          <td>
            <button class="mini-btn delete" data-action="delete-item" data-index="${idx}">${App.t("delete")}</button>
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
    if (selectedGroup === "controllers") {
      data().controllers.push({ name: "NEW", load: 1000000, price: 0 });
    } else if (selectedGroup === "accessories") {
      if (!data().accessories) data().accessories = [];
      data().accessories.push({ name: "NEW ACCESSORY", price: 0 });
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
    }
    renderTable();
    scheduleSave();
  }

  function deleteItem(idx) {
    if (!confirm(App.t("confirmDelete"))) return;
    group().items.splice(idx, 1);
    renderTable();
    scheduleSave();
  }

  function deleteController(idx) {
    if (!confirm(App.t("confirmDeleteCon"))) return;
    data().controllers.splice(idx, 1);
    renderTable();
    scheduleSave();
  }

  function deleteAccessory(idx) {
    if (!confirm(App.t("confirmDelete"))) return;
    if (data().accessories) data().accessories.splice(idx, 1);
    renderTable();
    scheduleSave();
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

  async function syncFromDB() {
    const syncSuccess = await App.syncFromDB();
    if (syncSuccess) {
      state.masterData = App.state.masterData;
      await AppStorage.saveState(state);
      renderTable();
      App.showToast("ดึงข้อมูลจาก Database เรียบร้อยแล้ว");
    } else {
      alert("ไม่สามารถดึงข้อมูลจาก Database ได้");
    }
  }

  async function resetToDefault() {
    if (!confirm(App.t("confirmReset"))) return;
    state.masterData = App.clone(DEFAULT_DATA);
    await AppStorage.saveState(state);
    renderTable();
    App.showToast(App.t("resetDone"));
  }

  async function boot() {
    await App.checkAuth();
    state = await AppStorage.loadState();
    state.ui = state.ui || { theme: "light", lang: "th" };
    // Ensure masterData exists and has items. If empty, seed from DEFAULT_DATA.
    const isDataEmpty = !state.masterData || !state.masterData.UIR || !state.masterData.UIR.items || state.masterData.UIR.items.length === 0;
    if (isDataEmpty) {
      state.masterData = App.clone(DEFAULT_DATA);
    }
    
    // Ensure nested structures like accessories exist
    if (!state.masterData.accessories) {
      state.masterData.accessories = App.clone(DEFAULT_DATA.accessories);
    }

    // Try to sync from Supabase first
    try {
      const syncSuccess = await App.syncFromDB();
      if (syncSuccess) {
        state.masterData = App.state.masterData;
      } else {
        console.warn("Supabase sync returned false, using local/default data.");
      }
    } catch (err) {
      console.error("Supabase sync exception:", err);
    }

    App.state = state;
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

    const syncBtn = document.getElementById("admin-sync-btn");
    if (syncBtn) syncBtn.addEventListener("click", syncFromDB);

    const resetBtn = document.getElementById("admin-reset-btn");
    if (resetBtn) resetBtn.addEventListener("click", resetToDefault);

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
