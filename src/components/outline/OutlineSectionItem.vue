<script setup lang="ts">
import { ref } from 'vue'
import type { OutlineSection } from '@/stores/studio'

const props = defineProps<{ section: OutlineSection; index: number }>()
const emit = defineEmits<{
  (e: 'update-title', title: string): void
  (e: 'add-bullet'): void
  (e: 'update-bullet', bulletId: string, text: string): void
  (e: 'remove-bullet', bulletId: string): void
  (e: 'remove'): void
}>()

const editingTitle = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)

function enterEditTitle() {
  editingTitle.value = true
  setTimeout(() => titleInput.value?.focus(), 0)
}
</script>

<template>
  <div
    class="group glass rounded-md p-4 hover:shadow-sm transition-all duration-base border border-hairline/10"
  >
    <header class="flex items-center gap-2">
      <span class="cursor-grab text-ink-300 select-none" title="拖拽排序">⋮⋮</span>
      <span
        class="w-7 h-7 rounded-full bg-brand-gradient-soft text-brand-600 grid place-items-center text-sm font-medium"
      >{{ index + 1 }}</span>

      <input
        v-if="editingTitle"
        ref="titleInput"
        :value="props.section.title"
        class="flex-1 h-9 px-2 rounded-sm bg-surface border border-brand-500/30 outline-none text-md font-medium focus-ring"
        @blur="editingTitle = false"
        @keydown.enter="(editingTitle = false)"
        @keydown.esc="editingTitle = false"
        @input="(e) => emit('update-title', (e.target as HTMLInputElement).value)"
      />
      <button
        v-else
        class="flex-1 text-left h-9 px-2 rounded-sm hover:bg-ink-900/[0.04] text-md font-medium truncate"
        @click="enterEditTitle"
      >{{ props.section.title }}</button>

      <button
        class="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 rounded-sm hover:bg-danger/10 hover:text-danger text-sm"
        title="删除章节"
        @click="emit('remove')"
      >✕</button>
    </header>

    <ul class="mt-2 ml-9 space-y-1">
      <li
        v-for="b in props.section.bullets"
        :key="b.id"
        class="group/bullet flex items-center gap-2 text-sm text-ink-700"
      >
        <span class="w-1 h-1 rounded-full bg-ink-300 shrink-0" />
        <input
          :value="b.text"
          class="flex-1 h-7 px-1.5 rounded-sm bg-transparent hover:bg-ink-900/[0.04] focus:bg-surface focus:border-brand-500/30 border border-transparent outline-none focus-ring transition-colors"
          @input="(e) => emit('update-bullet', b.id, (e.target as HTMLInputElement).value)"
        />
        <button
          class="opacity-0 group-hover/bullet:opacity-100 transition-opacity h-6 px-1.5 rounded-sm hover:bg-danger/10 hover:text-danger text-xs"
          title="删除要点"
          @click="emit('remove-bullet', b.id)"
        >✕</button>
      </li>
      <li>
        <button
          class="ml-3 text-xs text-ink-500 hover:text-brand-600 transition-colors"
          @click="emit('add-bullet')"
        >+ 添加要点</button>
      </li>
    </ul>
  </div>
</template>
