<script setup lang="ts">
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import type { DeckSummary } from '@/stores/studio'

const props = defineProps<{ deck: DeckSummary }>()
const emit = defineEmits<{
  (e: 'open'): void
  (e: 'duplicate'): void
  (e: 'remove'): void
}>()

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
onClickOutside(menuRef, () => (menuOpen.value = false))

const removeArmed = ref(false)
function tryRemove() {
  if (!removeArmed.value) {
    removeArmed.value = true
    setTimeout(() => (removeArmed.value = false), 2400)
    return
  }
  emit('remove')
  menuOpen.value = false
}

const updatedLabel = computed(() => {
  const diff = Date.now() - props.deck.updatedAt
  const day = 86400000
  if (diff < day) return '今天'
  if (diff < day * 2) return '昨天'
  if (diff < day * 7) return `${Math.floor(diff / day)} 天前`
  return new Date(props.deck.updatedAt).toLocaleDateString()
})
</script>

<template>
  <article
    class="group relative rounded-md overflow-hidden cursor-pointer ring-1 ring-hairline/10 hover:ring-hairline/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-base bg-surface"
    @click="emit('open')"
  >
    <div
      class="aspect-[16/9] relative flex items-end p-4"
      :style="{ background: props.deck.cover }"
    >
      <div class="text-white text-xs opacity-70">{{ props.deck.pages }} 页</div>
      <span
        v-if="props.deck.shared"
        class="absolute top-2 left-2 px-2 h-5 rounded-full text-[10px] bg-white/20 text-white backdrop-blur-sm"
      >已分享</span>

      <!-- 菜单 -->
      <div ref="menuRef" class="absolute top-2 right-2" @click.stop>
        <button
          class="w-7 h-7 rounded-full glass text-ink-900 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="更多"
          @click="menuOpen = !menuOpen"
        >⋯</button>
        <transition
          enter-active-class="transition-all duration-base ease-out"
          leave-active-class="transition-all duration-fast ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          leave-to-class="opacity-0"
        >
          <div
            v-if="menuOpen"
            class="absolute right-0 top-9 w-40 glass-strong rounded-md shadow-md p-1 text-sm"
          >
            <button
              class="w-full text-left h-8 px-2.5 rounded-sm hover:bg-ink-900/[0.06]"
              @click="emit('open')"
            >打开</button>
            <button
              class="w-full text-left h-8 px-2.5 rounded-sm hover:bg-ink-900/[0.06]"
              @click="emit('duplicate'); menuOpen = false"
            >复制</button>
            <button
              class="w-full text-left h-8 px-2.5 rounded-sm hover:bg-ink-900/[0.06]"
              @click="menuOpen = false"
            >重命名</button>
            <div class="my-1 h-px bg-hairline/10" />
            <button
              class="w-full text-left h-8 px-2.5 rounded-sm transition-colors"
              :class="removeArmed ? 'bg-danger text-white' : 'text-danger hover:bg-danger/10'"
              @click="tryRemove"
            >{{ removeArmed ? '再点一次确认删除' : '删除' }}</button>
          </div>
        </transition>
      </div>
    </div>

    <div class="p-3">
      <div class="font-medium text-sm truncate">{{ props.deck.title }}</div>
      <div class="text-xs text-ink-500 mt-0.5">编辑于 {{ updatedLabel }}</div>
    </div>
  </article>
</template>
