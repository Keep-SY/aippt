import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

type Theme = 'light' | 'dark' | 'auto'

const STORAGE_KEY = 'aippt:theme'

function applyTheme(t: Theme) {
  // 暗色为默认；只有显式 'light' 或 auto + 系统浅色，才切到 light
  const isLight =
    t === 'light' || (t === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('light', isLight)
  document.documentElement.classList.toggle('dark', !isLight)
}

export const useThemeStore = defineStore('theme', () => {
  // 默认 dark，与 code.html 风格一致
  const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'dark')

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
    theme.value = document.documentElement.classList.contains('light') ? 'dark' : 'light'
  }

  watch(theme, (t) => {
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
  })

  return { theme, init, set, toggle }
})
