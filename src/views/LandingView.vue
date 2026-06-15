<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useStudioStore } from '@/stores/studio'

const router = useRouter()
const theme = useThemeStore()
const studio = useStudioStore()
const prompt = ref('')

const suggestions = ['季度复盘', '产品发布', '学术答辩', '路演 BP', 'AI Agent 趋势']

function submit() {
  const t = prompt.value.trim()
  if (!t) return
  studio.setTopic(t)
  studio.replaceSections([])
  router.push({ name: 'outline' })
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- 背景层 -->
    <div class="absolute inset-0 retro-grid opacity-60" />
    <div class="beam left-[-10%] top-[-10%]" />
    <div class="beam right-[-15%] bottom-[-10%]" style="animation-delay: -7s" />

    <!-- 顶部导航 -->
    <header
      class="relative z-10 mx-auto max-w-7xl px-6 h-16 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-md bg-brand-gradient grid place-items-center text-white font-bold"
        >
          A
        </div>
        <span class="font-semibold tracking-tight">AI Slide Studio</span>
      </div>

      <nav class="hidden md:flex items-center gap-1">
        <button class="btn-ghost focus-ring" @click="router.push('/editor')">
          编辑器（演示）
        </button>
        <button class="btn-ghost focus-ring" @click="router.push('/templates')">
          模板
        </button>
        <button class="btn-ghost focus-ring" @click="router.push('/decks')">
          我的演示稿
        </button>
        <button class="btn-ghost focus-ring">定价</button>
      </nav>

      <div class="flex items-center gap-2">
        <button class="btn-ghost focus-ring" :title="theme.theme" @click="theme.toggle()">
          <span class="i">◐</span>
        </button>
        <button class="btn-shiny focus-ring h-10 px-5 text-sm">登录</button>
      </div>
    </header>

    <!-- Hero -->
    <main class="relative z-10 mx-auto max-w-4xl px-6 pt-16 md:pt-24 text-center">
      <div
        v-motion
        :initial="{ opacity: 0, y: 12 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 420 } }"
      >
        <div
          class="inline-flex items-center gap-2 px-3 h-8 rounded-full glass text-xs text-ink-700"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-breathe" />
          ✨ 由大模型驱动 · Powered by Kimi · GPT · Claude
        </div>
      </div>

      <h1
        v-motion
        :initial="{ opacity: 0, y: 16 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: 80, duration: 520 } }"
        class="mt-6 text-2xl md:text-3xl font-semibold leading-tight tracking-tight"
      >
        用一句话，<br class="md:hidden" />
        <span class="text-gradient">生成一份发布会级 PPT</span>
      </h1>

      <p
        v-motion
        :initial="{ opacity: 0 }"
        :enter="{ opacity: 1, transition: { delay: 200, duration: 420 } }"
        class="mt-4 text-ink-500 text-md"
      >
        从想法到成品，平均 30 秒。可编辑、可演讲、可导出 PPTX。
      </p>

      <!-- 主输入框 -->
      <div
        v-motion
        :initial="{ opacity: 0, y: 16 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: 280, duration: 520 } }"
        class="mt-10"
      >
        <div
          class="glass-strong rounded-xl p-3 md:p-4 shadow-lg focus-within:shadow-glow transition-shadow duration-base"
        >
          <textarea
            v-model="prompt"
            rows="3"
            placeholder="例如：用 12 页讲清楚 AI Agent 的现状、技术栈与未来趋势 ..."
            class="w-full resize-none bg-transparent outline-none text-md placeholder:text-ink-300 px-3 py-2"
            @keydown.meta.enter="submit"
            @keydown.ctrl.enter="submit"
          />
          <div class="flex items-center justify-between gap-2 px-2 pt-2">
            <div class="flex items-center gap-2 text-sm text-ink-500">
              <button class="btn-ghost focus-ring h-9 px-3 text-sm">📎 文档</button>
              <button class="btn-ghost focus-ring h-9 px-3 text-sm">🎨 风格</button>
              <button class="btn-ghost focus-ring h-9 px-3 text-sm">📄 12 页 ▾</button>
            </div>
            <button class="btn-shiny focus-ring h-11 px-6" @click="submit">
              生成 PPT
              <span class="opacity-80">→</span>
            </button>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap gap-2 justify-center">
          <span class="text-sm text-ink-500 mr-1">💡 试试：</span>
          <button
            v-for="s in suggestions"
            :key="s"
            class="px-3 h-8 rounded-full text-sm glass hover:shadow-md transition-all duration-base hover:-translate-y-0.5"
            @click="prompt = `${s}：`"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Token 验证区：色板与组件示例 -->
      <section class="mt-24 text-left">
        <div class="text-xs uppercase tracking-widest text-ink-500 mb-3">
          Design Tokens · 落地校验
        </div>

        <!-- 色板 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div class="rounded-lg p-4 bg-brand-gradient text-white shadow-md">
            <div class="text-xs opacity-80">Brand Gradient</div>
            <div class="font-semibold">#7C5CFF → #4FA8FF</div>
          </div>
          <div class="rounded-lg p-4 glass">
            <div class="text-xs text-ink-500">Glass / Surface</div>
            <div class="font-semibold">backdrop-blur 20px</div>
          </div>
          <div class="rounded-lg p-4 bg-ink-900 text-white">
            <div class="text-xs opacity-70">Ink 900</div>
            <div class="font-semibold">#0F1226</div>
          </div>
          <div class="rounded-lg p-4 bg-canvas border border-hairline/10">
            <div class="text-xs text-ink-500">Canvas</div>
            <div class="font-semibold">#F7F8FC</div>
          </div>
        </div>

        <!-- 按钮 / 阴影 -->
        <div class="grid md:grid-cols-3 gap-4">
          <div class="glass rounded-lg p-5">
            <div class="text-xs text-ink-500 mb-3">Buttons</div>
            <div class="flex flex-wrap gap-2">
              <button class="btn-shiny focus-ring h-10 px-5 text-sm">Shiny</button>
              <button class="btn-ghost focus-ring">Ghost</button>
              <button
                class="inline-flex items-center h-10 px-4 rounded-md border border-hairline/15 text-sm hover:bg-ink-900/[0.04] transition-colors"
              >
                Outline
              </button>
            </div>
          </div>

          <div class="glass rounded-lg p-5">
            <div class="text-xs text-ink-500 mb-3">Shadows</div>
            <div class="flex gap-3">
              <div class="w-14 h-14 rounded-md bg-surface shadow-sm" />
              <div class="w-14 h-14 rounded-md bg-surface shadow-md" />
              <div class="w-14 h-14 rounded-md bg-surface shadow-lg" />
            </div>
          </div>

          <div class="glass rounded-lg p-5">
            <div class="text-xs text-ink-500 mb-3">Motion</div>
            <div class="flex gap-3 items-center">
              <span class="w-10 h-10 rounded-full bg-brand-500 animate-breathe" />
              <span
                class="px-3 h-9 rounded-md text-sm relative overflow-hidden text-white"
                style="background: linear-gradient(135deg,#7C5CFF,#4FA8FF)"
              >
                <span class="relative z-10">Shimmer</span>
                <span
                  class="absolute inset-0 animate-shimmer"
                  style="
                    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);
                    background-size: 200% 100%;
                  "
                />
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer class="mt-24 mb-12 text-center text-xs text-ink-500">
        v0.1 · 工程骨架已就绪 · 下一步：Editor 三栏 + Fabric 双向绑定
      </footer>
    </main>
  </div>
</template>
