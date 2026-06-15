/**
 * useDragSort —— 极简的列表拖拽排序
 * 用法：
 *   const { onDragStart, onDragOver, onDrop, dragIndex, overIndex } = useDragSort((from, to) => move(from, to))
 *   <li :draggable="true" @dragstart="onDragStart(i, $event)" @dragover="onDragOver(i, $event)" @drop="onDrop()" />
 */
import { ref } from 'vue'

export function useDragSort(onMove: (from: number, to: number) => void) {
  const dragIndex = ref<number | null>(null)
  const overIndex = ref<number | null>(null)

  function onDragStart(index: number, e: DragEvent) {
    dragIndex.value = index
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(index))
    }
  }

  function onDragOver(index: number, e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    overIndex.value = index
  }

  function onDragLeave() {
    overIndex.value = null
  }

  function onDrop() {
    if (dragIndex.value !== null && overIndex.value !== null && dragIndex.value !== overIndex.value) {
      onMove(dragIndex.value, overIndex.value)
    }
    dragIndex.value = null
    overIndex.value = null
  }

  function onDragEnd() {
    dragIndex.value = null
    overIndex.value = null
  }

  return { dragIndex, overIndex, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd }
}
