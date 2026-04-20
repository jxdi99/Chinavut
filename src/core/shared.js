import { StaffAPI } from '../api/client.js'
import { AppStorage } from '../../storage.js' // temporary until storage is refactored

export const App = {
  state: null,
  
  t(key) {
    const lang = App.state?.ui?.lang || 'th'
    return window.I18N?.[lang]?.[key] || key
  },

  applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n
      if (key) el.textContent = App.t(key)
    })
  },

  async checkAuth() {
    const state = await AppStorage.loadState()
    App.state = state
    if (!state.currentUser && !window.location.pathname.endsWith('login.html')) {
      window.location.href = 'login.html'
    }
  },

  async logout() {
    App.state.currentUser = null
    await AppStorage.saveState(App.state)
    window.location.href = 'login.html'
  }
};
