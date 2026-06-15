<script setup lang="ts">
import { computed } from 'vue'
import type { Slide } from '@/stores/deck'

const props = defineProps<{
  slide: Slide
  index: number
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'duplicate'): void
  (e: 'remove'): void
}>()

/** 简易缩略：从 fabricJson 提取首段文字作为缩略标题 */
const previewTitle = computed(() => {
  const json = props.slide.fabricJson as { objects?: { type?: string; text?: string }[] } | undefined
  const t = json?.objects?.find((o) => o.type === 'Textbox' || o.type === 'i-text')?.text
  return t || props.slide.title
})
</script>

<template>
  <div
    class="group relative cursor-pointer select-none"
    :class="[
      'rounded-md border transition-all duration-base',
      active
        ? 'border-brand-500/60 shadow-md ring-1 ring-brand-500/20'
        : 'border-hairline/10 hover:border-hairline/20 hover:shadow-sm'
    ]"
  >
    <!-- 顶部序号 + 操作 -->
    <div class="flex items-center justify-between px-2 pt-1.5 text-[11px] text-ink-500">
      <span :class="active ? 'text-brand-500 font-medium' : ''">{{ index + 1 }}</span>
      <div
        class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          class="w-5 h-5 rounded-sm hover:bg-ink-900/[0.06] grid place-items-center"
          title="复制"
          @click.stop="emit('duplicate')"
        >
          ⎘
        </button>
        <button
          class="w-5 h-5 rounded-sm hover:bg-danger/10 hover:text-danger grid place-items-center"
          title="删除"
          @click.stop="emit('remove')"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 16:9 缩略 -->
    <div
      class="m-1.5 aspect-[16/9] rounded-sm bg-white border border-hairline/10 overflow-hidden flex items-center justify-center px-2"
    >
      <div class="text-[10px] text-ink-700 line-clamp-3 text-center leading-snug">
        {{ previewTitle }}
      </div>
    </div>

    <!-- 选中态左侧渐变条 -->
    <span
      v-if="active"
      class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-sm bg-brand-gradient"
    />
  </div>
</template>
