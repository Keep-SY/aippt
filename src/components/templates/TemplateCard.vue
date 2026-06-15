<script setup lang="ts">
import type { Template } from '@/stores/studio'

const props = defineProps<{ template: Template; selected: boolean }>()
const emit = defineEmits<{
  (e: 'select'): void
  (e: 'preview'): void
}>()
</script>

<template>
  <article
    class="group relative rounded-md overflow-hidden cursor-pointer transition-all duration-base hover:-translate-y-1 hover:shadow-lg"
    :class="
      props.selected
        ? 'ring-2 ring-brand-500 shadow-md'
        : 'ring-1 ring-hairline/10 hover:ring-hairline/20'
    "
    @click="emit('select')"
  >
    <!-- 缩略图 -->
    <div
      class="aspect-[16/9] relative flex items-end p-4"
      :style="{ background: props.template.bg }"
    >
      <!-- 模拟 PPT 内容 -->
      <div class="relative z-10 text-white">
        <div class="text-xs opacity-70 mb-1">第 1 页</div>
        <div
          class="font-bold text-base leading-tight"
          :class="{ 'font-serif': props.template.font === 'serif', 'font-mono': props.template.font === 'mono' }"
        >标题占位 · {{ props.template.name }}</div>
        <div
          class="mt-1 h-0.5 w-10 rounded-full"
          :style="{ background: props.template.accent }"
        />
      </div>

      <!-- 实时预览按钮（hover） -->
      <button
        class="absolute top-2 right-2 z-20 px-2.5 h-7 rounded-full text-xs glass text-ink-900 opacity-0 group-hover:opacity-100 transition-all duration-base hover:shadow-sm"
        @click.stop="emit('preview')"
      >👁 预览</button>

      <!-- 已选角标 -->
      <div
        v-if="props.selected"
        class="absolute top-2 left-2 z-20 w-6 h-6 rounded-full bg-white text-brand-600 grid place-items-center text-xs font-bold shadow-md"
      >✓</div>
    </div>

    <!-- 元信息 -->
    <div class="p-3 bg-surface flex items-center justify-between">
      <div class="min-w-0">
        <div class="font-medium text-sm truncate">{{ props.template.name }}</div>
        <div class="text-xs text-ink-500">{{ props.template.category }}</div>
      </div>
      <div class="w-3 h-3 rounded-full" :style="{ background: props.template.accent }" />
    </div>
  </article>
</template>
