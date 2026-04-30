import { MasterDataAPI } from "../src/api/client.js";

(function () {
  window.App = window.App || {};
  App.clone = (obj) => JSON.parse(JSON.stringify(obj));

  App.syncFromDB = async function () {
    try {
      const dbData = await MasterDataAPI.fetchFull();
      if (dbData && App.state) {
        App.state.masterData = dbData;
        await AppStorage.saveState(App.state);
        return true;
      }
      // If we got null, it means there was a DB error (logged in client.js)
      console.error("MasterData sync failed.");
      return false;
    } catch (err) {
      console.error("Sync Error Exception:", err);
      return false;
    }
  };

  App.t = function (key) {
    const lang = App.state?.ui?.lang || "th";
    return (
      (window.I18N[lang] && window.I18N[lang][key]) ||
      window.I18N.th[key] ||
      key
    );
  };

  App.applyTheme = function (theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (btn)
      btn.textContent =
        theme === "dark"
          ? `${App.t("theme")}: ${App.t("dark")}`
          : `${App.t("theme")}: ${App.t("light")}`;
  };

  App.applyLanguage = function () {
    const lang = App.state.ui.lang;
    document.documentElement.lang = lang === "en" ? "en" : "th";

    // อัปเดต text content
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const text = App.t(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA")
        el.placeholder = text;
      else {
        el.textContent = text;
      }
    });

    // อัปเดต placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const text = App.t(key);
      if (text && text !== key) {
        el.placeholder = text;
      }
    });

    // อัปเดต option ใน select ที่มี data-i18n
    document.querySelectorAll("select option[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const text = App.t(key);
      el.textContent = text;
    });

    // **เพิ่มเพื่อให้ mode toggle buttons อัปเดต**
    const modeQtyBtn = document.getElementById("mode-qty");
    const modeSizeBtn = document.getElementById("mode-size");
    if (modeQtyBtn) modeQtyBtn.textContent = App.t("modeQty");
    if (modeSizeBtn) modeSizeBtn.textContent = App.t("modeSize");

    const langBtn = document.getElementById("lang-toggle");
    if (langBtn) {
      const opts = langBtn.querySelectorAll(".lang-opt");
      if (opts.length > 0) {
        opts.forEach((opt) => {
          if (opt.dataset.lang === lang) opt.classList.add("active");
          else opt.classList.remove("active");
        });
      } else {
        langBtn.textContent = lang === "th" ? "TH / EN" : "EN / TH";
      }
    }
    App.applyTheme(App.state.ui.theme);
  };

  App.setLang = async function (lang) {
    App.state.ui.lang = lang;
    await AppStorage.saveState(App.state);
    App.applyLanguage();
    if (typeof App.renderAll === "function") App.renderAll();
  };

  App.toggleTheme = async function () {
    App.state.ui.theme = App.state.ui.theme === "dark" ? "light" : "dark";
    await AppStorage.saveState(App.state);
    App.applyTheme(App.state.ui.theme);
  };

  App.toggleLang = async function () {
    const next = App.state.ui.lang === "th" ? "en" : "th";
    await App.setLang(next);
  };

  App.handleLangClick = async function (e) {
    const btn = e.target.closest(".lang-opt");
    if (!btn) return;
    const lang = btn.dataset.lang;
    if (lang && lang !== App.state.ui.lang) {
      await App.setLang(lang);
    }
  };

  App.showToast = function (msg) {
    if (window.__toastTimer) clearTimeout(window.__toastTimer);
    let box = document.getElementById("toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "toast";
      box.style.cssText =
        "position:fixed;bottom:18px;right:18px;z-index:99999;background:var(--primary);color:#fff;padding:12px 14px;border-radius:12px;box-shadow:var(--shadow);max-width:min(92vw,360px);";
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.style.display = "block";
    window.__toastTimer = setTimeout(() => {
      box.style.display = "none";
    }, 1800);
  };

  App.checkAuth = async function () {
    if (
      window.location.pathname.endsWith("/") ||
      window.location.pathname.endsWith("index.html")
    ) {
      // Don't redirect if we're already on the root index (login page)
      if (!window.location.pathname.includes("/backend/")) {
         return;
      }
    }
    if (window.location.pathname.toLowerCase().includes("/public")) return;
    if (window.location.pathname.includes("reset-password")) return;
    
    const state = await AppStorage.loadState();
    if (!state.currentUser) {
      if (window.location.pathname.includes("/backend/")) {
        // If we're not already on the backend login page (index.html)
        if (!window.location.pathname.endsWith("index.html") && !window.location.pathname.endsWith("/backend/")) {
           window.location.href = './index.html';
        }
      } else {
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        window.location.href = basePath + 'index.html';
      }
    }
  };

  App.logout = async function () {
    if (App.state.currentUser) {
      try {
        const { supabase } = await import("../src/api/client.js");
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.error("Supabase signout failed", e);
      }
    }
    App.state.currentUser = null;
    App.state.lastInputs = null;
    await AppStorage.saveState(App.state);
    
    if (window.location.pathname.includes("/backend/")) {
      window.location.href = './index.html';
    } else {
      const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      window.location.href = basePath + 'index.html';
    }
  };

  App.renderWelcomeBanner = function () {
    const container = document.getElementById("welcome-banner-section");
    if (!container) return;

    const u = App.state.currentUser;
    if (u) {
      container.innerHTML = `
        <div class="welcome-banner">
          <div class="welcome-dept">${u.dept} DEPARTMENT</div>
          <div class="welcome-title">${App.t("welcome")} คุณ ${u.name}</div>
        </div>
      `;
    } else {
      container.innerHTML = "";
    }
  };
})();
