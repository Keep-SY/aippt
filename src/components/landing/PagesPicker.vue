<script setup lang="ts">
/**
 * 落地页"页数"选择器：直接修改 studio.outline.pages
 * 预设 6 / 8 / 12 / 16 / 20，外加自定义输入（3-40）
 */
import { ref, computed } from 'vue'
import { useStudioStore } from '@/stores/studio'

const studio = useStudioStore()

const presets = [6, 8, 12, 16, 20]
const open = ref(false)
const customVal = ref<number | ''>('')

const current = computed(() => studio.outline.pages)

function pick(n: number) {
  studio.setPages(n)
  open.value = false
}

function applyCustom() {
  const n = Number(customVal.value)
  if (!Number.isFinite(n)) return
  studio.setPages(n)
  customVal.value = ''
  open.value = false
}
</script>

<template>
  <VDropdown
    :distance="8"
    placement="top-start"
    :shown="open"
    @apply-show="open = true"
    @apply-hide="open = false"
  >
    <button
      type="button"
      class="btn-ghost focus-ring h-9 px-3 text-sm inline-flex items-center gap-1"
    >
      <span>📄 {{ current }} 页</span>
      <span class="opacity-60 text-xs">▾</span>
    </button>

    <template #popper>
      <div class="w-[220px] p-2 text-left">
        <div class="text-[11px] uppercase tracking-widest text-ink-500 px-2 mb-1.5">
          目标页数
        </div>
        <div class="grid grid-cols-3 gap-1.5 px-1">
          <button
            v-for="n in presets"
            :key="n"
            class="h-8 rounded-sm text-sm transition-colors"
            :class="current === n
              ? 'bg-brand-500 text-white font-semibold'
              : 'bg-ink-900/[0.04] hover:bg-ink-900/[0.08] text-ink-700'"
            @click="pick(n)"
          >{{ n }}</button>
        </div>

        <div class="mt-2 flex items-center gap-1.5 px-1">
          <input
            v-model.number="customVal"
            type="number"
            min="3"
            max="40"
            placeholder="自定义"
            class="flex-1 h-8 rounded-sm bg-surface border border-hairline/15 px-2 text-sm focus-ring focus:border-brand-500/40 outline-none"
            @keydown.enter="applyCustom"
          />
          <button
            class="px-2 h-8 rounded-sm text-xs bg-brand-gradient-soft text-brand-600 hover:shadow-sm transition-all disabled:opacity-50"
            :disabled="customVal === '' || Number(customVal) < 3 || Number(customVal) > 40"
            @click="applyCustom"
          >应用</button>
        </div>
        <div class="mt-1 px-2 text-[10px] text-ink-500">范围 3 – 40</div>
      </div>
    </template>
  </VDropdown>
</template>