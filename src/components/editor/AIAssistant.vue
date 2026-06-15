<script setup lang="ts">
import { inject, ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { FabricApiKey } from '@/composables/fabricApiKey'
import { rewrite, type RewriteKind } from '@/services/ai'
import { isArkConfigured } from '@/services/ark'

const canvas = useCanvasStore()
const api = inject(FabricApiKey)
const prompt = ref('')

interface Quick {
  kind: RewriteKind
  label: string
  desc: string
}
const quick: Quick[] = [
  { kind: 'rewrite', label: '✏️ 改写', desc: '保留含义，改更专业' },
  { kind: 'expand', label: '📝 扩写', desc: '增加细节与例子' },
  { kind: 'shorten', label: '📐 缩短', desc: '压缩到一半' },
  { kind: 'translate', label: '🌐 翻译', desc: '中 ↔ 英' },
  { kind: 'restyle', label: '🎨 换风格', desc: '商务 / 科技 / 极简' },
  { kind: 'proofread', label: '🔍 纠错', desc: '语法与错别字' }
]

const history = ref<{ id: number; title: string; time: string }[]>([])
const running = ref<RewriteKind | null>(null)
const errorMsg = ref<string | null>(null)
let ctrl: AbortController | null = null

function selectedText(): string | null {
  const fc = api?.getCanvas()
  const o = fc?.getActiveObject() as { text?: string } | null
  return o?.text ?? null
}

async function runRewrite(kind: RewriteKind) {
  errorMsg.value = null
  if (!isArkConfigured()) {
    errorMsg.value = '未配置豆包 API Key（VITE_ARK_API_KEY）。'
    return
  }

  const fc = api?.getCanvas()
  const obj = fc?.getActiveObject() as
    | (fabric.Object & { text?: string; set: (props: object) => void })
    | null
  const original = obj?.text
  if (!obj || !original) {
    errorMsg.value = '请先在画布上选中一段文字。'
    return
  }

  running.value = kind
  ctrl?.abort()
  ctrl = new AbortController()

  try {
    await rewrite({
      kind,
      text: original,
      signal: ctrl.signal,
      onDelta: (_d, full) => {
        // 流式回写：实时刷新选中的 Textbox
        obj.set({ text: full })
        fc?.requestRenderAll()
      }
    })
    history.value = [
      { id: Date.now(), title: `${labelOf(kind)}：${original.slice(0, 18)}…`, time: '刚刚' },
      ...history.value
    ].slice(0, 5)
    // 持久化最终结果到 deck
    api?.updateSelectedProp({ text: obj.text })
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    running.value = null
  }
}

async function send() {
  const q = prompt.value.trim()
  if (!q) return
  prompt.value = ''
  errorMsg.value = null

  if (!isArkConfigured()) {
    errorMsg.value = '未配置豆包 API Key（VITE_ARK_API_KEY）。'
    return
  }

  const text = selectedText()
  if (!text) {
    errorMsg.value = '对话功能需先选中一段文字作为上下文。'
    return
  }

  const fc = api?.getCanvas()
  const obj = fc?.getActiveObject() as
    | (fabric.Object & { text?: string; set: (props: object) => void })
    | null
  if (!obj) return

  running.value = 'rewrite'
  ctrl?.abort()
  ctrl = new AbortController()
  try {
    await rewrite({
      kind: 'rewrite',
      text: `${q}\n\n原文：\n${text}`,
      signal: ctrl.signal,
      onDelta: (_d, full) => {
        obj.set({ text: full })
        fc?.requestRenderAll()
      }
    })
    api?.updateSelectedProp({ text: obj.text })
    history.value = [
      { id: Date.now(), title: q.slice(0, 24), time: '刚刚' },
      ...history.value
    ].slice(0, 5)
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    running.value = null
  }
}

function labelOf(kind: RewriteKind) {
  return quick.find((q) => q.kind === kind)?.label ?? kind
}
</script>

<template>
  <div class="p-4 space-y-5">
    <!-- 上下文 -->
    <div
      class="rounded-md border border-hairline/10 bg-brand-gradient-soft px-3 py-2.5 text-xs text-ink-700"
    >
      <div class="flex items-center gap-1.5 mb-0.5">
        <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-breathe" />
        <span class="font-medium">当前上下文</span>
      </div>
      <div class="text-ink-500">
        {{
          canvas.selection.count === 0
            ? '当前页（未选中元素）'
            : canvas.selection.count > 1
              ? `选中 ${canvas.selection.count} 个元素`
              : `选中：${canvas.selection.type}`
        }}
      </div>
    </div>

    <!-- 错误 -->
    <div
      v-if="errorMsg"
      class="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger"
    >{{ errorMsg }}</div>

    <!-- 快捷操作 -->
    <section>
      <div class="text-xs uppercase tracking-widest text-ink-500 mb-2">快捷操作</div>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="q in quick"
          :key="q.kind"
          class="text-left rounded-md border border-hairline/10 px-2.5 py-2 text-sm hover:border-brand-500/40 hover:bg-brand-gradient-soft transition-all duration-base disabled:opacity-50"
          :title="q.desc"
          :disabled="!!running"
          @click="runRewrite(q.kind)"
        >
          <div class="font-medium flex items-center gap-1.5">
            <span
              v-if="running === q.kind"
              class="inline-block w-3 h-3 rounded-full border-2 border-brand-500/40 border-t-brand-500 animate-spin"
            />
            <span>{{ q.label }}</span>
          </div>
          <div class="text-[11px] text-ink-500 mt-0.5">{{ q.desc }}</div>
        </button>
      </div>
    </section>

    <!-- 对话框 -->
    <section>
      <div class="text-xs uppercase tracking-widest text-ink-500 mb-2">直接对话</div>
      <div
        class="glass rounded-md p-2 focus-within:shadow-glow transition-shadow duration-base"
      >
        <textarea
          v-model="prompt"
          rows="3"
          placeholder="把这页改成更专业商务的语气..."
          class="w-full bg-transparent outline-none resize-none text-sm placeholder:text-ink-300 px-1"
          @keydown.enter.exact.prevent="send"
        />
        <div class="flex items-center justify-between pt-1">
          <span class="text-[11px] text-ink-500">↵ 发送 · ⇧↵ 换行</span>
          <button
            class="btn-shiny focus-ring h-8 px-3 text-xs disabled:opacity-50"
            :disabled="!prompt.trim() || !!running"
            @click="send"
          >发送 →</button>
        </div>
      </div>
    </section>

    <!-- 历史 -->
    <section v-if="history.length">
      <div class="text-xs uppercase tracking-widest text-ink-500 mb-2">最近</div>
      <ul class="space-y-1">
        <li
          v-for="h in history"
          :key="h.id"
          class="flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-ink-900/[0.04] cursor-pointer text-sm"
        >
          <span class="truncate">{{ h.title }}</span>
          <span class="text-[11px] text-ink-500 shrink-0 ml-2">{{ h.time }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
