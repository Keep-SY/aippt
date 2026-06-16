<script setup lang="ts">
/**
 * 落地页"📎 文档"按钮：把已有素材作为大纲生成的额外上下文。
 * v1 范围：txt / md / 粘贴文本 / URL（仅作为字符串提示，不抓取）。
 * 解析后的纯文本会写入 studio.attachments，submit 时随 topic 一起进入 generateOutline。
 */
import { ref, computed } from 'vue'
import {
  useStudioStore,
  ATTACHMENT_MAX_CHARS,
  ATTACHMENT_TOTAL_MAX_CHARS,
  type Attachment
} from '@/stores/studio'

const studio = useStudioStore()

const open = ref(false)
const dragOver = ref(false)
const pasteText = ref('')
const errorMsg = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const ACCEPT_EXT = ['.txt', '.md', '.markdown']
const ACCEPT_ATTR = ACCEPT_EXT.join(',') + ',text/plain,text/markdown'

const remainChars = computed(() =>
  Math.max(0, ATTACHMENT_TOTAL_MAX_CHARS - studio.attachmentTotalChars)
)

function flashError(msg: string) {
  errorMsg.value = msg
  setTimeout(() => {
    if (errorMsg.value === msg) errorMsg.value = null
  }, 2400)
}

function isTextLike(file: File): boolean {
  if (file.type.startsWith('text/')) return true
  const name = file.name.toLowerCase()
  return ACCEPT_EXT.some((ext) => name.endsWith(ext))
}

async function handleFiles(files: FileList | File[]) {
  const list = Array.from(files)
  for (const f of list) {
    if (!isTextLike(f)) {
      flashError(`暂不支持 ${f.name}（v1 仅支持 txt/md，pdf/docx 后续接入）`)
      continue
    }
    if (remainChars.value <= 0) {
      flashError('附件总量已达上限，请先移除一些')
      break
    }
    try {
      const raw = await f.text()
      const text = raw.slice(0, Math.min(ATTACHMENT_MAX_CHARS, remainChars.value))
      studio.addAttachment({
        name: f.name,
        kind: 'file',
        text,
        bytes: f.size
      })
    } catch (e) {
      flashError(`读取失败：${f.name}`)
    }
  }
}

function onPickFiles(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  handleFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

const URL_RE = /^https?:\/\/\S+$/i

function addPasted() {
  const raw = pasteText.value.trim()
  if (!raw) return
  if (remainChars.value <= 0) {
    flashError('附件总量已达上限')
    return
  }
  if (URL_RE.test(raw) && !raw.includes('\n')) {
    studio.addAttachment({
      name: raw.length > 60 ? raw.slice(0, 60) + '…' : raw,
      kind: 'url',
      text: `（参考链接，模型将参考其领域含义，不做实时抓取）${raw}`
    })
  } else {
    const idx = studio.attachments.filter((a) => a.kind === 'text').length + 1
    const text = raw.slice(0, Math.min(ATTACHMENT_MAX_CHARS, remainChars.value))
    studio.addAttachment({
      name: `粘贴文本 #${idx}`,
      kind: 'text',
      text
    })
  }
  pasteText.value = ''
}

function fmtBytes(n?: number): string {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function iconOf(a: Attachment): string {
  if (a.kind === 'file') return '📄'
  if (a.kind === 'url') return '🔗'
  return '📝'
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
      class="btn-ghost focus-ring h-9 px-3 text-sm inline-flex items-center gap-1.5"
      :class="{ 'text-brand-600': studio.attachments.length > 0 }"
    >
      <span>📎 文档</span>
      <span
        v-if="studio.attachments.length"
        class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-semibold"
      >{{ studio.attachments.length }}</span>
    </button>

    <template #popper>
      <div class="w-[360px] p-3 text-left">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs uppercase tracking-widest text-ink-500">参考资料</div>
          <button
            v-if="studio.attachments.length"
            class="text-xs text-ink-500 hover:text-danger transition-colors"
            @click="studio.clearAttachments()"
          >全部清空</button>
        </div>

        <!-- 拖拽区 -->
        <label
          class="block rounded-md border border-dashed transition-colors cursor-pointer"
          :class="dragOver
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-hairline/25 hover:border-brand-500/40 hover:bg-ink-900/[0.02]'"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
        >
          <div class="px-4 py-5 text-center text-xs text-ink-500">
            <div class="text-base mb-1">⬆️</div>
            <div>把 .txt / .md 拖进来，或<span class="text-brand-600 underline ml-0.5">点击选择</span></div>
            <div class="mt-1 text-ink-300">v1 暂不支持 PDF / DOCX</div>
          </div>
          <input
            ref="fileInput"
            type="file"
            multiple
            class="hidden"
            :accept="ACCEPT_ATTR"
            @change="onPickFiles"
          />
        </label>

        <!-- 粘贴 URL / 文本 -->
        <div class="mt-3">
          <textarea
            v-model="pasteText"
            rows="2"
            placeholder="粘贴 URL 或一段参考文字…（Ctrl/⌘ Enter 添加）"
            class="w-full resize-none bg-surface border border-hairline/15 rounded-md px-3 py-2 text-sm outline-none focus:border-brand-500/40 focus-ring"
            @keydown.meta.enter.prevent="addPasted"
            @keydown.ctrl.enter.prevent="addPasted"
          />
          <div class="flex items-center justify-between mt-1 text-[11px] text-ink-500">
            <span>剩余可加约 {{ remainChars.toLocaleString() }} 字</span>
            <button
              class="px-2 h-7 rounded-sm text-xs bg-brand-gradient-soft text-brand-600 hover:shadow-sm transition-all disabled:opacity-50"
              :disabled="!pasteText.trim()"
              @click="addPasted"
            >添加</button>
          </div>
        </div>

        <!-- 列表 -->
        <ul v-if="studio.attachments.length" class="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
          <li
            v-for="a in studio.attachments"
            :key="a.id"
            class="flex items-center gap-2 px-2 py-1.5 rounded-sm bg-ink-900/[0.04] hover:bg-ink-900/[0.07] text-xs"
          >
            <span class="shrink-0">{{ iconOf(a) }}</span>
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium text-ink-900">{{ a.name }}</div>
              <div class="text-ink-500 text-[10px]">
                {{ a.text.length.toLocaleString() }} 字
                <span v-if="a.bytes"> · {{ fmtBytes(a.bytes) }}</span>
              </div>
            </div>
            <button
              class="shrink-0 w-6 h-6 rounded-sm text-ink-500 hover:text-danger hover:bg-danger/10 transition-colors"
              title="移除"
              @click="studio.removeAttachment(a.id)"
            >×</button>
          </li>
        </ul>

        <transition
          enter-active-class="transition-all duration-fast ease-out"
          leave-active-class="transition-all duration-fast ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          leave-to-class="opacity-0"
        >
          <div
            v-if="errorMsg"
            class="mt-2 px-2 py-1.5 rounded-sm text-[11px] text-danger bg-danger/10 border border-danger/30"
          >⚠ {{ errorMsg }}</div>
        </transition>
      </div>
    </template>
  </VDropdown>
</template>