/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARK_API_KEY?: string
  readonly VITE_ARK_MODEL?: string
  readonly VITE_ARK_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
