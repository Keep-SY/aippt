import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // 后端模式：FastAPI（推荐，生产同样架构）
      // /api/* → http://localhost:8000/api/*
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      // 直连模式：dev 期跳过 CORS 直接打到 ARK（仅本地调试）
      // 浏览器访问 /ark/chat/completions → ark.cn-beijing.volces.com/api/v3/chat/completions
      '/ark': {
        target: 'https://ark.cn-beijing.volces.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ark/, '/api/v3')
      }
    }
  }
})
