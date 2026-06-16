<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { useThemeStore } from '@/stores/theme'
import DeckCard from '@/components/decks/DeckCard.vue'

const router = useRouter()
const studio = useStudioStore()
const theme = useThemeStore()

const search = ref('')
type SortKey = 'recent' | 'name' | 'pages'
const sort = ref<SortKey>('recent')
type ViewMode = 'grid' | 'list'
const viewMode = ref<ViewMode>('grid')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  let arr = studio.decks.filter((d) => !q || d.title.toLowerCase().includes(q))
  if (sort.value === 'recent') arr = [...arr].sort((a, b) => b.updatedAt - a.updatedAt)
  if (sort.value === 'name') arr = [...arr].sort((a, b) => a.title.localeCompare(b.title))
  if (sort.value === 'pages') arr = [...arr].sort((a, b) => b.pages - a.pages)
  return arr
})
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header
      class="sticky top-0 z-20 h-14 px-6 flex items-center justify-between glass-strong border-b hairline border-b-hairline/10"
    >
      <div class="flex items-center gap-3">
        <button class="btn-ghost focus-ring h-9 px-2" @click="router.push('/app')">←</button>
        <div
          class="w-7 h-7 rounded-md bg-brand-gradient grid place-items-center text-white text-sm font-bold"
        >A</div>
        <span class="font-medium">我的演示稿</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-ghost focus-ring h-9 px-3 text-sm" @click="theme.toggle()">◐</button>
        <button class="btn-shiny focus-ring h-9 px-4 text-sm" @click="router.push('/app')">
          + 新建
        </button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <!-- 工具条 -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <div class="relative flex-1 min-w-[220px] max-w-md">
          <input
            v-model="search"
            type="search"
            placeholder="搜索演示稿..."
            class="w-full h-10 pl-9 pr-3 rounded-md bg-surface border border-hairline/15 text-sm focus-ring"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300">🔍</span>
        </div>

        <select
          v-model="sort"
          class="h-10 rounded-md bg-surface border border-hairline/15 px-3 text-sm focus-ring"
        >
          <option value="recent">最近编辑</option>
          <option value="name">按名称</option>
          <option value="pages">按页数</option>
        </select>

        <div class="flex items-center gap-1 rounded-md bg-surface border border-hairline/15 p-1">
          <button
            class="h-7 px-2.5 rounded-sm text-sm transition-colors"
            :class="viewMode === 'grid' ? 'bg-ink-900/[0.08] text-ink-900' : 'text-ink-500'"
            @click="viewMode = 'grid'"
          >▦ 网格</button>
          <button
            class="h-7 px-2.5 rounded-sm text-sm transition-colors"
            :class="viewMode === 'list' ? 'bg-ink-900/[0.08] text-ink-900' : 'text-ink-500'"
            @click="viewMode = 'list'"
          >☰ 列表</button>
        </div>
      </div>

      <!-- 空态 -->
      <div v-if="filtered.length === 0" class="text-center py-24">
        <div class="text-5xl mb-4 opacity-30">📂</div>
        <div class="text-ink-700">没有匹配的演示稿</div>
        <div class="text-sm text-ink-500 mt-1">试试不同的关键词，或者新建一份</div>
      </div>

      <!-- 网格 -->
      <div
        v-else-if="viewMode === 'grid'"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <DeckCard
          v-for="(d, i) in filtered"
          :key="d.id"
          :deck="d"
          :style="{ animationDelay: `${i * 30}ms` }"
          class="animate-fade-in-up"
          @open="router.push('/editor')"
          @duplicate="studio.duplicateDeck(d.id)"
          @remove="studio.removeDeck(d.id)"
        />
      </div>

      <!-- 列表 -->
      <ul v-else class="rounded-md border border-hairline/10 overflow-hidden bg-surface">
        <li
          v-for="d in filtered"
          :key="d.id"
          class="flex items-center gap-4 px-4 py-3 border-b hairline border-b-hairline/10 last:border-b-0 hover:bg-ink-900/[0.02] cursor-pointer transition-colors"
          @click="router.push('/editor')"
        >
          <div
            class="w-16 h-9 rounded-sm shrink-0 ring-1 ring-hairline/10"
            :style="{ background: d.cover }"
          />
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ d.title }}</div>
            <div class="text-xs text-ink-500">{{ d.pages }} 页</div>
          </div>
          <div class="text-xs text-ink-500 hidden md:block">
            {{ new Date(d.updatedAt).toLocaleDateString() }}
          </div>
          <button
            class="btn-ghost focus-ring h-8 px-2 text-sm"
            title="删除"
            @click.stop="studio.removeDeck(d.id)"
          >✕</button>
        </li>
      </ul>
    </main>
  </div>
</template>
