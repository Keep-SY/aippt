<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useStudioStore } from '@/stores/studio'
import AttachmentPopover from '@/components/landing/AttachmentPopover.vue'
import PagesPicker from '@/components/landing/PagesPicker.vue'

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
    <!-- 背景层：orb 与官网风格保持一致 -->
    <div class="absolute inset-0 retro-grid opacity-50" />
    <div
      class="orb animate-orb-float"
      style="width:520px;height:520px;top:-12%;left:-10%;background:radial-gradient(circle, rgba(45,212,191,0.32), transparent 70%);"
    />
    <div
      class="orb animate-orb-float"
      style="width:420px;height:420px;bottom:-15%;right:-8%;animation-direction:reverse;animation-duration:22s;background:radial-gradient(circle, rgba(110,231,183,0.22), transparent 70%);"
    />

    <!-- 顶部导航 -->
    <header
      class="relative z-10 mx-auto max-w-7xl px-6 h-16 flex items-center justify-between"
    >
      <button
        class="flex items-center gap-2.5 font-display font-extrabold text-xl"
        @click="router.push('/')"
      >
        <span
          class="w-9 h-9 rounded-[10px] grid place-items-center text-white text-lg font-black bg-brand-gradient"
        >S</span>
        智演 AI
      </button>

      <nav class="hidden md:flex items-center gap-1">
        <button class="btn-ghost focus-ring" @click="router.push('/templates')">
          模板
        </button>
        <button class="btn-ghost focus-ring" @click="router.push('/decks')">
          我的演示稿
        </button>
        <button class="btn-ghost focus-ring" @click="router.push('/')">
          官网
        </button>
      </nav>

      <div class="flex items-center gap-2">
        <button class="btn-ghost focus-ring" :title="theme.theme" @click="theme.toggle()">
          <span class="i">◐</span>
        </button>
        <button class="btn-shiny focus-ring h-10 px-5 text-sm">登录</button>
      </div>
    </header>

    <!-- Hero -->
    <main
      class="relative z-10 mx-auto max-w-4xl px-6 pt-20 md:pt-28 pb-16 text-center flex flex-col items-center"
    >
      <div
        v-motion
        :initial="{ opacity: 0, y: 12 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 420 } }"
      >
        <div
          class="inline-flex items-center gap-2 px-4 h-8 rounded-full border border-white/10 bg-surface/60 backdrop-blur text-xs text-ink-500"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_#34d399] animate-pulse-dot" />
          ✨ 由大模型驱动 · Powered by 豆包 · GPT · Claude
        </div>
      </div>

      <h1
        v-motion
        :initial="{ opacity: 0, y: 16 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: 80, duration: 520 } }"
        class="mt-8 font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.15] tracking-tight"
      >
        用一句话，<br class="md:hidden" />
        <span class="text-gradient">生成一份发布会级 PPT</span>
      </h1>

      <p
        v-motion
        :initial="{ opacity: 0 }"
        :enter="{ opacity: 1, transition: { delay: 200, duration: 420 } }"
        class="mt-5 text-ink-500 text-lg md:text-xl max-w-2xl"
      >
        从想法到成品，平均 30 秒。可编辑、可演讲、可导出 PPTX。
      </p>

      <!-- 主输入框 -->
      <div
        v-motion
        :initial="{ opacity: 0, y: 16 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: 280, duration: 520 } }"
        class="mt-12 w-full"
      >
        <div
          class="rounded-2xl p-3 md:p-4 text-left transition-all duration-base"
          style="
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(28px) saturate(140%);
            -webkit-backdrop-filter: blur(28px) saturate(140%);
            border: 1px solid rgba(255,255,255,0.18);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.18),
              0 24px 60px rgba(0,0,0,0.35),
              0 0 0 1px rgba(45,212,191,0.06),
              0 0 80px rgba(45,212,191,0.10);
          "
        >
          <textarea
            v-model="prompt"
            rows="3"
            :placeholder="`例如：用 ${studio.outline.pages} 页讲清楚 AI Agent 的现状、技术栈与未来趋势 ...`"
            class="w-full resize-none bg-transparent outline-none text-base md:text-lg placeholder:text-ink-300 px-3 py-2 text-ink-900"
            @keydown.meta.enter="submit"
            @keydown.ctrl.enter="submit"
          />
          <div class="flex items-center justify-between gap-2 px-2 pt-2">
            <div class="flex items-center gap-2 text-sm text-ink-500">
              <AttachmentPopover />
              <PagesPicker />
            </div>
            <button class="btn-shiny focus-ring h-11 px-6 text-base" @click="submit">
              生成 PPT
              <span class="opacity-80">→</span>
            </button>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-2 justify-center">
          <span class="text-sm text-ink-500 mr-1">💡 试试：</span>
          <button
            v-for="s in suggestions"
            :key="s"
            class="px-3 h-8 rounded-full text-sm border border-white/10 bg-surface/40 text-ink-700 hover:border-brand-500/40 hover:bg-brand-500/10 hover:-translate-y-0.5 transition-all duration-base"
            @click="prompt = `${s}：`"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <footer class="mt-28 mb-8 text-center text-xs text-ink-300">
        智演 AI · 由 Vue 3 + Fabric.js 驱动
      </footer>
    </main>
  </div>
</template>
