import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

type Theme = 'light' | 'dark' | 'auto'

const STORAGE_KEY = 'aippt:theme'

function applyTheme(t: Theme) {
  const isDark =
    t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'auto')

  function init() {
    applyTheme(theme.value)
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', () => {
      if (theme.value === 'auto') applyTheme('auto')
    })
  }

  function set(t: Theme) {
    theme.value = t
  }

  function toggle() {
    theme.value = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
  }

  watch(theme, (t) => {
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
  })

  return { theme, init, set, toggle }
})
