<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { useDeckStore } from '@/stores/deck'
import { expandSection } from '@/services/ai'
import { isArkConfigured } from '@/services/ark'
import GenerationProgress from '@/components/generating/GenerationProgress.vue'
import GeneratedThumbnailStrip from '@/components/generating/GeneratedThumbnailStrip.vue'
import GenerationSteps from '@/components/generating/GenerationSteps.vue'

const router = useRouter()
const studio = useStudioStore()
const deck = useDeckStore()

interface ThumbItem {
  index: number
  title: string
  bullets: string[]
  partial?: string
}

type StepKey = 'parse' | 'match' | 'pages' | 'illustrate' | 'layout'
type StepStatus = 'pending' | 'active' | 'done' | 'error'

const steps = ref<{ key: StepKey; label: string; status: StepStatus }[]>([
  { key: 'parse', label: '解析提纲', status: 'pending' },
  { key: 'match', label: '匹配模板', status: 'pending' },
  { key: 'pages', label: '正在生成内容', status: 'pending' },
  { key: 'illustrate', label: '智能配图', status: 'pending' },
  { key: 'layout', label: '排版优化', status: 'pending' }
])

const progress = ref(0) // 0-100
const currentPage = ref(0)
const totalPages = ref(studio.outline.sections.length)
const generatedItems = ref<ThumbItem[]>([])
const errorMsg = ref<string | null>(null)
const aborted = ref(false)
const ctrl = new AbortController()

const tips = [
  '专业演示稿平均每页停留 30-60 秒，过密反而失焦。',
  '一句话主张 + 三个支撑点，是最稳的页面结构。',
  '图表的标题应直接说出结论，而不是"销售数据"。',
  '深色背景 + 高饱和度强调色，是发布会风格的核心。',
  '逐字念稿是演讲的大忌——把要点抽成关键词。'
]
const tipIndex = ref(0)
let tipTimer: ReturnType<typeof setInterval> | null = null

const headline = computed(() =>
  steps.value.find((s) => s.status === 'active')?.label ?? '正在为你打造演示稿'
)

function setStep(key: StepKey, status: StepStatus) {
  const s = steps.value.find((x) => x.key === key)
  if (s) s.status = status
}

async function run() {
  // —— 0. 检查配置 ——
  if (!isArkConfigured()) {
    errorMsg.value =
      '未检测到 VITE_ARK_API_KEY。请复制 .env.example 为 .env.local 并填入豆包 API Key 后重启 dev 服务。'
    return
  }

  try {
    // —— 1. 校验大纲 —— Outline 页负责生成,这里只校验
    setStep('parse', 'active')
    progress.value = 8
    if (studio.outline.sections.length === 0) {
      throw new Error('大纲为空,请回到上一步先生成或编写大纲')
    }
    totalPages.value = studio.outline.sections.length
    setStep('parse', 'done')

    // —— 2. 匹配模板（这里只是把已选模板视为完成） ——
    setStep('match', 'active')
    progress.value = 16
    await delay(280)
    setStep('match', 'done')

    // —— 3. 逐章节生成（流式打字机），同时 push 缩略图 ——
    setStep('pages', 'active')
    for (let i = 0; i < studio.outline.sections.length; i++) {
      if (ctrl.signal.aborted) return
      currentPage.value = i + 1

      const sec = studio.outline.sections[i]
      const item: ThumbItem = {
        index: i,
        title: sec.title,
        bullets: sec.bullets.map((b) => b.text),
        partial: ''
      }
      generatedItems.value = [...generatedItems.value, item]

      // 流式扩写（用作页面 speaker note 的 demo，UI 上展示打字机效果）
      try {
        await expandSection({
          outline: studio.outline,
          section: sec,
          signal: ctrl.signal,
          onDelta: (_d, full) => {
            const next = [...generatedItems.value]
            next[i] = { ...next[i], partial: full }
            generatedItems.value = next
          }
        })
      } catch (e) {
        // 单章失败不阻断整体；记录但继续
        console.warn('expandSection failed', e)
      }

      progress.value = 16 + Math.round((70 * (i + 1)) / studio.outline.sections.length)
    }
    setStep('pages', 'done')

    // —— 4. 配图（占位） ——
    setStep('illustrate', 'active')
    progress.value = 90
    await delay(420)
    setStep('illustrate', 'done')

    // —— 5. 排版优化：把 outline + 模板写入 deck ——
    setStep('layout', 'active')
    progress.value = 96
    deck.buildFromOutline(studio.outline, {
      bg: studio.selectedTemplate.bg,
      accent: studio.selectedTemplate.accent,
      font: studio.selectedTemplate.font
    })
    await delay(280)
    progress.value = 100
    setStep('layout', 'done')

    // 跳转
    await delay(360)
    router.replace('/editor')
  } catch (e) {
    if (aborted.value) return
    errorMsg.value = (e as Error).message
    const active = steps.value.find((s) => s.status === 'active')
    if (active) active.status = 'error'
  }
}

function cancel() {
  aborted.value = true
  ctrl.abort()
  router.back()
}

function retry() {
  errorMsg.value = null
  steps.value.forEach((s) => (s.status = 'pending'))
  progress.value = 0
  generatedItems.value = []
  run()
}

onMounted(() => {
  run()
  tipTimer = setInterval(() => {
    tipIndex.value = (tipIndex.value + 1) % tips.length
  }, 4200)
})

onBeforeUnmount(() => {
  ctrl.abort()
  if (tipTimer) clearInterval(tipTimer)
})

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-canvas">
    <!-- 背景：retro grid + 双 Beam -->
    <div class="absolute inset-0 retro-grid opacity-50" />
    <div class="beam left-[-10%] top-[-15%]" />
    <div class="beam right-[-15%] bottom-[-10%]" style="animation-delay: -7s" />

    <main class="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-24">
      <!-- 顶部标题 -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-2 px-3 h-7 rounded-full glass text-xs text-ink-700 mb-4">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-breathe" />
          ✨ 正在为你打造演示稿
        </div>
        <h1 class="text-xl md:text-2xl font-semibold tracking-tight">
          {{ headline }}
        </h1>
      </div>

      <!-- 错误态 -->
      <div
        v-if="errorMsg"
        class="glass-strong rounded-md p-5 mb-6 border border-danger/30"
        v-motion
        :initial="{ opacity: 0, y: 8 }"
        :enter="{ opacity: 1, y: 0 }"
      >
        <div class="text-sm text-danger font-medium mb-1">⚠ 生成失败</div>
        <div class="text-sm text-ink-700 whitespace-pre-line">{{ errorMsg }}</div>
        <div class="mt-4 flex items-center gap-2">
          <button class="btn-ghost focus-ring h-9 px-3 text-sm" @click="cancel">返回</button>
          <button class="btn-shiny focus-ring h-9 px-4 text-sm" @click="retry">重试</button>
        </div>
      </div>

      <!-- 进度环 + 步骤 -->
      <div v-else class="grid md:grid-cols-[200px_1fr] gap-8 items-center mb-10">
        <GenerationProgress :value="progress" />
        <GenerationSteps :steps="steps" :current-page="currentPage" :total-pages="totalPages" />
      </div>

      <!-- 实时缩略图带 -->
      <GeneratedThumbnailStrip v-if="!errorMsg" :items="generatedItems" />

      <!-- Tip -->
      <transition
        enter-active-class="transition-all duration-slow ease-out"
        leave-active-class="transition-all duration-base ease-out"
        enter-from-class="opacity-0 translate-y-2"
        leave-to-class="opacity-0 -translate-y-2"
        mode="out-in"
      >
        <div
          v-if="!errorMsg"
          :key="tipIndex"
          class="mt-12 text-center text-sm text-ink-500 italic"
        >
          "{{ tips[tipIndex] }}"
        </div>
      </transition>

      <!-- 取消 -->
      <div v-if="!errorMsg" class="mt-8 text-center">
        <button class="btn-ghost focus-ring h-9 px-4 text-sm" @click="cancel">
          取消生成
        </button>
      </div>
    </main>
  </div>
</template>
