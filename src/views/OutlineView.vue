<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { useThemeStore } from '@/stores/theme'
import OutlineSectionItem from '@/components/outline/OutlineSectionItem.vue'
import { useDragSort } from '@/composables/useDragSort'
import { generateOutline, rewrite } from '@/services/ai'
import { isArkConfigured } from '@/services/ark'

const router = useRouter()
const studio = useStudioStore()
const theme = useThemeStore()

const { dragIndex, overIndex, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } = useDragSort(
  (from, to) => studio.moveSection(from, to)
)

const aiHint = ref<string | null>(null)
const aiBusy = ref(false)
const aiError = ref<string | null>(null)
let abortCtrl: AbortController | null = null

async function draftOutline() {
  if (aiBusy.value) return
  if (!studio.outline.topic.trim()) {
    aiError.value = '请先在上方填写演示标题'
    return
  }
  if (!isArkConfigured()) {
    aiError.value = '后端未就绪：检查 server 是否启动且 ARK_API_KEY 已配置'
    return
  }
  aiError.value = null
  aiBusy.value = true
  aiHint.value = '正在让 AI 起草大纲...'
  abortCtrl = new AbortController()
  try {
    const o = await generateOutline({
      topic: studio.outline.topic,
      pages: studio.outline.pages,
      signal: abortCtrl.signal
    })
    studio.outline.topic = o.topic
    studio.outline.pages = o.pages
    studio.replaceSections(o.sections)
    aiHint.value = '✓ 大纲已生成'
    setTimeout(() => (aiHint.value = null), 1400)
  } catch (e) {
    aiError.value = (e as Error).message || 'AI 调用失败'
    aiHint.value = null
  } finally {
    aiBusy.value = false
  }
}

async function aiAdjust(kind: 'detail' | 'concise' | 'angle') {
  if (aiBusy.value) return
  if (studio.outline.sections.length === 0) {
    aiError.value = '请先生成或编写大纲'
    return
  }
  if (!isArkConfigured()) {
    aiError.value = '后端未就绪'
    return
  }
  const map = { detail: 'expand', concise: 'shorten', angle: 'rewrite' } as const
  const label = { detail: '增加细节', concise: '精简', angle: '换角度' }[kind]
  aiError.value = null
  aiBusy.value = true
  aiHint.value = `正在让 AI ${label}...`
  abortCtrl = new AbortController()
  try {
    const payload = JSON.stringify(
      studio.outline.sections.map((s) => ({
        title: s.title,
        bullets: s.bullets.map((b) => b.text)
      }))
    )
    const out = await rewrite({
      kind: map[kind],
      text: `请对下列 PPT 大纲（JSON）${label}，仅返回相同结构的 JSON：\n${payload}`,
      signal: abortCtrl.signal
    })
    const parsed = JSON.parse(stripFence(out)) as { title: string; bullets: string[] }[]
    const uid = () => Math.random().toString(36).slice(2, 10)
    studio.replaceSections(
      parsed.map((s) => ({
        id: uid(),
        title: s.title,
        bullets: (s.bullets || []).map((t) => ({ id: uid(), text: t }))
      }))
    )
    aiHint.value = `✓ 已${label}`
    setTimeout(() => (aiHint.value = null), 1400)
  } catch (e) {
    aiError.value = (e as Error).message || 'AI 调整失败'
    aiHint.value = null
  } finally {
    aiBusy.value = false
  }
}

function stripFence(s: string): string {
  const t = s.trim()
  if (t.startsWith('```')) {
    return t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim()
  }
  return t
}

onMounted(() => {
  // 从 Landing 带 topic 进来且无 sections，自动起草一次
  if (studio.outline.topic.trim() && studio.outline.sections.length === 0) {
    draftOutline()
  }
})
</script>

<template>
  <div class="relative min-h-screen bg-canvas">
    <!-- 顶部 -->
    <header
      class="sticky top-0 z-20 h-14 px-6 flex items-center justify-between glass-strong border-b hairline border-b-hairline/10"
    >
      <div class="flex items-center gap-3 min-w-0">
        <button class="btn-ghost focus-ring h-9 px-2" @click="router.push('/')">←</button>
        <div
          class="w-7 h-7 rounded-md bg-brand-gradient grid place-items-center text-white text-sm font-bold"
        >A</div>
        <span class="font-medium">大纲编辑</span>
        <span class="text-xs text-ink-500 hidden md:inline">· AI 已为你起草，可微调</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-ghost focus-ring h-9 px-3 text-sm" @click="theme.toggle()">◐</button>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 pt-10 pb-32">
      <!-- 标题 -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs uppercase tracking-widest text-ink-500">📝 演示标题</label>
          <button
            class="btn-ghost focus-ring h-7 px-2 text-xs"
            :disabled="aiBusy"
            @click="draftOutline()"
          >
            ✨ AI 起草
          </button>
        </div>
        <input
          :value="studio.outline.topic"
          class="w-full h-12 px-4 rounded-md bg-surface border border-hairline/15 text-md font-medium focus-ring focus:border-brand-500/40"
          @input="(e) => studio.setTopic((e.target as HTMLInputElement).value)"
        />
        <div class="mt-3 flex items-center gap-3 text-sm text-ink-500">
          <label class="flex items-center gap-2">
            页数
            <input
              type="number"
              min="3"
              max="40"
              :value="studio.outline.pages"
              class="w-16 h-8 rounded-sm bg-surface border border-hairline/15 px-2 text-sm focus-ring text-center"
              @change="(e) => studio.setPages(Number((e.target as HTMLInputElement).value))"
            />
          </label>
          <span>·</span>
          <span>预计 {{ studio.outline.sections.length }} 个章节</span>
        </div>
      </section>

      <!-- 大纲 -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <label class="text-xs uppercase tracking-widest text-ink-500">📚 大纲（可拖拽排序）</label>
          <span class="text-xs text-ink-500">{{ studio.outline.sections.length }} 个章节</span>
        </div>

        <div
          v-if="aiError"
          class="mb-3 px-3 py-2 rounded-md text-xs text-danger bg-danger/10 border border-danger/30"
        >
          ⚠ {{ aiError }}
        </div>

        <div
          v-if="studio.outline.sections.length === 0 && !aiBusy"
          class="rounded-md border border-dashed border-hairline/20 p-8 text-center text-sm text-ink-500"
        >
          还没有大纲。点击右上角
          <button class="text-brand-600 underline mx-1" @click="draftOutline()">✨ AI 起草</button>
          让模型根据你的标题生成。
        </div>

        <div
          v-if="aiBusy"
          class="rounded-md p-6 text-center text-sm text-brand-600 mb-3"
        >
          <span class="inline-block w-2 h-2 rounded-full bg-brand-500 animate-breathe mr-2" />
          正在让 AI 思考...
        </div>

        <ul class="space-y-3">
          <li
            v-for="(section, i) in studio.outline.sections"
            :key="section.id"
            :draggable="true"
            class="transition-all duration-base"
            :class="{
              'opacity-40 scale-[0.99]': dragIndex === i,
              'ring-2 ring-brand-500/40 ring-offset-2 ring-offset-canvas': overIndex === i && dragIndex !== i
            }"
            @dragstart="onDragStart(i, $event)"
            @dragover="onDragOver(i, $event)"
            @dragleave="onDragLeave"
            @drop="onDrop"
            @dragend="onDragEnd"
          >
            <OutlineSectionItem
              :section="section"
              :index="i"
              @update-title="(t) => studio.updateSectionTitle(section.id, t)"
              @add-bullet="studio.addBullet(section.id)"
              @update-bullet="(bid, t) => studio.updateBullet(section.id, bid, t)"
              @remove-bullet="(bid) => studio.removeBullet(section.id, bid)"
              @remove="studio.removeSection(section.id)"
            />
          </li>
        </ul>

        <button
          class="mt-4 w-full h-11 rounded-md border border-dashed border-hairline/20 text-sm text-ink-500 hover:bg-ink-900/[0.04] hover:text-ink-900 transition-colors focus-ring"
          @click="studio.addSection()"
        >
          + 添加章节
        </button>
      </section>
    </main>

    <!-- AI 调整浮窗 -->
    <div
      class="fixed bottom-24 right-6 z-30 glass-strong rounded-md p-3 w-64 shadow-lg"
      v-motion
      :initial="{ opacity: 0, x: 20 }"
      :enter="{ opacity: 1, x: 0, transition: { duration: 320, delay: 400 } }"
    >
      <div class="text-xs text-ink-500 mb-2">💬 让 AI 帮你调整：</div>
      <div class="flex flex-wrap gap-1.5">
        <button
          class="px-3 h-7 rounded-full text-xs bg-brand-gradient-soft text-brand-600 hover:shadow-sm transition-all hover:-translate-y-0.5"
          @click="aiAdjust('detail')"
        >更详细</button>
        <button
          class="px-3 h-7 rounded-full text-xs bg-brand-gradient-soft text-brand-600 hover:shadow-sm transition-all hover:-translate-y-0.5"
          @click="aiAdjust('concise')"
        >更精简</button>
        <button
          class="px-3 h-7 rounded-full text-xs bg-brand-gradient-soft text-brand-600 hover:shadow-sm transition-all hover:-translate-y-0.5"
          @click="aiAdjust('angle')"
        >换角度</button>
      </div>
      <transition
        enter-active-class="transition-all duration-base ease-out"
        leave-active-class="transition-all duration-fast ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        leave-to-class="opacity-0"
      >
        <div v-if="aiHint" class="mt-2 text-xs text-brand-600 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-breathe" />
          {{ aiHint }}
        </div>
      </transition>
    </div>

    <!-- 底部 sticky 操作 -->
    <footer
      class="fixed bottom-0 inset-x-0 h-16 z-20 glass-strong border-t hairline border-t-hairline/10"
    >
      <div class="max-w-3xl mx-auto h-full px-6 flex items-center justify-between">
        <button class="btn-ghost focus-ring" @click="router.push('/')">← 上一步</button>
        <button
          class="btn-shiny focus-ring h-10 px-6"
          :disabled="studio.outline.sections.length === 0 || aiBusy"
          :class="{ 'opacity-50 cursor-not-allowed': studio.outline.sections.length === 0 || aiBusy }"
          @click="router.push('/templates')"
        >
          选择模板 →
        </button>
      </div>
    </footer>
  </div>
</template>
