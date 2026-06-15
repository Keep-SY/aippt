<script setup lang="ts">
import { computed, inject } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { FabricApiKey } from '@/composables/fabricApiKey'

const canvas = useCanvasStore()
const api = inject(FabricApiKey)

const sel = computed(() => canvas.selection)
const isText = computed(() => sel.value.type === 'Textbox' || sel.value.type === 'i-text')

const presetColors = ['#0F1226', '#7C5CFF', '#4FA8FF', '#10B981', '#F59E0B', '#EF4444', '#FFFFFF']
const fontFamilies = ['Inter, PingFang SC, sans-serif', 'JetBrains Mono, monospace', 'serif']
const aligns = ['left', 'center', 'right'] as const

function update(key: string, value: unknown) {
  api?.updateSelectedProp({ [key]: value })
}
</script>

<template>
  <div class="p-4 space-y-5">
    <!-- 空态 -->
    <div v-if="!sel.count" class="text-center py-12">
      <div class="text-4xl mb-3 opacity-30">◇</div>
      <div class="text-sm text-ink-500">在画布上选中元素</div>
      <div class="text-xs text-ink-300 mt-1">即可编辑其属性</div>
    </div>

    <!-- 多选 -->
    <div v-else-if="sel.count > 1" class="text-center py-12">
      <div class="text-sm text-ink-700">已选中 {{ sel.count }} 个元素</div>
      <div class="text-xs text-ink-500 mt-2">多选支持位置 / 删除 / 层级操作</div>
    </div>

    <template v-else>
      <!-- 类型 -->
      <div class="text-xs uppercase tracking-widest text-ink-500">{{ sel.type }}</div>

      <!-- 文本属性 -->
      <section v-if="isText" class="space-y-3">
        <label class="block text-xs text-ink-500">字体</label>
        <select
          class="w-full h-9 rounded-sm bg-surface border border-hairline/15 px-2 text-sm focus-ring"
          :value="sel.fontFamily"
          @change="(e) => update('fontFamily', (e.target as HTMLSelectElement).value)"
        >
          <option v-for="f in fontFamilies" :key="f" :value="f">{{ f.split(',')[0] }}</option>
        </select>

        <label class="block text-xs text-ink-500">字号 {{ sel.fontSize }}</label>
        <input
          type="range"
          min="8"
          max="160"
          :value="sel.fontSize"
          class="w-full accent-brand-500"
          @input="(e) => update('fontSize', Number((e.target as HTMLInputElement).value))"
        />

        <label class="block text-xs text-ink-500">对齐</label>
        <div class="flex gap-1">
          <button
            v-for="a in aligns"
            :key="a"
            class="flex-1 h-8 rounded-sm text-sm capitalize transition-colors"
            :class="
              sel.textAlign === a
                ? 'bg-ink-900/[0.08] text-ink-900'
                : 'hover:bg-ink-900/[0.04] text-ink-500'
            "
            @click="update('textAlign', a)"
          >
            {{ a }}
          </button>
        </div>

        <label class="flex items-center gap-2 text-xs text-ink-500 cursor-pointer">
          <input
            type="checkbox"
            class="accent-brand-500"
            :checked="String(sel.fontWeight) === '700' || sel.fontWeight === 'bold'"
            @change="(e) => update('fontWeight', (e.target as HTMLInputElement).checked ? 700 : 400)"
          />
          加粗
        </label>
      </section>

      <!-- 颜色（文本/形状统一） -->
      <section class="space-y-2">
        <label class="block text-xs text-ink-500">{{ isText ? '文字颜色' : '填充' }}</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in presetColors"
            :key="c"
            class="w-7 h-7 rounded-md ring-1 ring-hairline/15 transition-transform hover:scale-110"
            :style="{ background: c }"
            :title="c"
            @click="update('fill', c)"
          />
          <input
            type="color"
            class="w-7 h-7 rounded-md cursor-pointer bg-transparent border border-hairline/20"
            :value="(sel.fill as string) || '#0F1226'"
            @input="(e) => update('fill', (e.target as HTMLInputElement).value)"
          />
        </div>
      </section>

      <!-- 不透明度 -->
      <section class="space-y-2">
        <label class="block text-xs text-ink-500">
          不透明度 {{ Math.round((sel.opacity ?? 1) * 100) }}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          :value="(sel.opacity ?? 1) * 100"
          class="w-full accent-brand-500"
          @input="(e) => update('opacity', Number((e.target as HTMLInputElement).value) / 100)"
        />
      </section>

      <!-- 位置 / 旋转 -->
      <section class="space-y-2">
        <label class="block text-xs text-ink-500">位置</label>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex items-center gap-1 text-xs text-ink-500">
            X
            <input
              type="number"
              :value="Math.round(sel.left ?? 0)"
              class="w-full h-8 rounded-sm bg-surface border border-hairline/15 px-2 text-sm focus-ring"
              @change="(e) => update('left', Number((e.target as HTMLInputElement).value))"
            />
          </label>
          <label class="flex items-center gap-1 text-xs text-ink-500">
            Y
            <input
              type="number"
              :value="Math.round(sel.top ?? 0)"
              class="w-full h-8 rounded-sm bg-surface border border-hairline/15 px-2 text-sm focus-ring"
              @change="(e) => update('top', Number((e.target as HTMLInputElement).value))"
            />
          </label>
        </div>
        <label class="block text-xs text-ink-500">旋转 {{ Math.round(sel.angle ?? 0) }}°</label>
        <input
          type="range"
          min="-180"
          max="180"
          :value="sel.angle ?? 0"
          class="w-full accent-brand-500"
          @input="(e) => update('angle', Number((e.target as HTMLInputElement).value))"
        />
      </section>
    </template>
  </div>
</template>
