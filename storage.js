(function(){
  const DB_NAME = 'razr_led_db';
  const DB_VERSION = 1;
  const STORE = 'kv';
  const STATE_KEY = 'app_state';

  function clone(obj){
    return JSON.parse(JSON.stringify(obj));
  }

  function fallbackState() {
    return {
      masterData: clone(window.DEFAULT_DATA),
      ui: { theme: 'light', lang: 'th' }
    };
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function loadState() {
    try {
      const db = await openDB();
      if (!db) {
        const saved = localStorage.getItem(STATE_KEY);
        return saved ? JSON.parse(saved) : fallbackState();
      }
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        const req = store.get(STATE_KEY);
        req.onsuccess = () => resolve(req.result || fallbackState());
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('loadState fallback', err);
      const saved = localStorage.getItem(STATE_KEY);
      return saved ? JSON.parse(saved) : fallbackState();
    }
  }

  async function saveState(state) {
    try {
      const db = await openDB();
      if (!db) {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        return true;
      }
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const req = store.put(state, STATE_KEY);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('saveState fallback', err);
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      return false;
    }
  }

  window.AppStorage = { loadState, saveState };
})();
