<script setup lang="ts">
import { computed, inject } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { FabricApiKey } from '@/composables/fabricApiKey'

const canvas = useCanvasStore()
const api = inject(FabricApiKey)

const sel = computed(() => canvas.selection)
const isText = computed(() => {
  const t = sel.value.type
  return t === 'textbox' || t === 'text' || t === 'i-text'
})

const fontSize = computed(() => sel.value.fontSize ?? 24)
const isBold = computed(() => {
  const w = sel.value.fontWeight
  return w === 'bold' || w === 700 || w === '700'
})
const isItalic = computed(() => sel.value.fontStyle === 'italic')
const isUnderline = computed(() => !!sel.value.underline)
const align = computed(() => sel.value.textAlign ?? 'left')
const fill = computed(() => (sel.value.fill as string) ?? '#000000')

const presetColors = [
  '#0f1226', '#ffffff', '#7c6aff', '#2dd4bf', '#34d399',
  '#f472b6', '#fbbf24', '#ef4444'
]

function patch(props: Record<string, unknown>) {
  api?.updateSelectedProp(props)
}

function bumpSize(delta: number) {
  const next = Math.max(8, Math.min(200, Math.round(fontSize.value + delta)))
  patch({ fontSize: next })
}

function setSize(v: number) {
  if (Number.isFinite(v)) patch({ fontSize: Math.max(8, Math.min(200, Math.round(v))) })
}
</script>

<template>
  <div
    v-if="isText"
    class="selection-toolbar flex items-center gap-1 h-9 px-1.5 rounded-md bg-elevated/95 border border-white/10 shadow-lg backdrop-blur-glass text-ink-900"
    @mousedown.stop
    @pointerdown.stop
  >
    <!-- 字号 -->
    <button class="tb-btn" title="缩小字号" @click="bumpSize(-2)">A−</button>
    <input
      type="number"
      class="w-12 h-7 text-center bg-transparent border border-white/10 rounded-sm text-xs tabular-nums focus:outline-none focus:border-brand-500/50"
      :value="fontSize"
      min="8"
      max="200"
      @change="(e) => setSize(Number((e.target as HTMLInputElement).value))"
    />
    <button class="tb-btn" title="放大字号" @click="bumpSize(2)">A+</button>

    <span class="w-px h-5 bg-white/10 mx-0.5" />

    <!-- 加粗/斜体/下划线 -->
    <button
      class="tb-btn font-bold"
      :class="{ 'tb-active': isBold }"
      title="加粗"
      @click="patch({ fontWeight: isBold ? 'normal' : 'bold' })"
    >B</button>
    <button
      class="tb-btn italic"
      :class="{ 'tb-active': isItalic }"
      title="斜体"
      @click="patch({ fontStyle: isItalic ? 'normal' : 'italic' })"
    >I</button>
    <button
      class="tb-btn underline"
      :class="{ 'tb-active': isUnderline }"
      title="下划线"
      @click="patch({ underline: !isUnderline })"
    >U</button>

    <span class="w-px h-5 bg-white/10 mx-0.5" />

    <!-- 对齐 -->
    <button
      class="tb-btn"
      :class="{ 'tb-active': align === 'left' }"
      title="左对齐"
      @click="patch({ textAlign: 'left' })"
    >⇤</button>
    <button
      class="tb-btn"
      :class="{ 'tb-active': align === 'center' }"
      title="居中"
      @click="patch({ textAlign: 'center' })"
    >≡</button>
    <button
      class="tb-btn"
      :class="{ 'tb-active': align === 'right' }"
      title="右对齐"
      @click="patch({ textAlign: 'right' })"
    >⇥</button>

    <span class="w-px h-5 bg-white/10 mx-0.5" />

    <!-- 颜色 -->
    <div class="flex items-center gap-0.5">
      <button
        v-for="c in presetColors"
        :key="c"
        class="w-5 h-5 rounded-sm ring-1 ring-white/10 hover:ring-white/30 transition-all"
        :class="{ 'ring-2 ring-brand-500/80': fill.toLowerCase() === c.toLowerCase() }"
        :style="{ background: c }"
        :title="c"
        @click="patch({ fill: c })"
      />
      <label class="w-5 h-5 rounded-sm ring-1 ring-white/10 grid place-items-center cursor-pointer relative overflow-hidden">
        <span class="text-[10px]">🎨</span>
        <input
          type="color"
          class="absolute inset-0 opacity-0 cursor-pointer"
          :value="fill"
          @input="(e) => patch({ fill: (e.target as HTMLInputElement).value })"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.tb-btn {
  @apply inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-sm text-xs text-ink-700 hover:bg-white/10 hover:text-ink-900 transition-colors;
}
.tb-active {
  @apply bg-brand-500/15 text-brand-400;
}
.selection-toolbar {
  user-select: none;
}
</style>
