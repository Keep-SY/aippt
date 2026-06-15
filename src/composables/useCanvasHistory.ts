/**
 * 简单的 stack 式 undo/redo
 * 每次写入都做一次 JSON 快照（够用、易实现；将来可换 patch-based）
 */
const MAX = 50

export function useCanvasHistory() {
  let stack: unknown[] = []
  let cursor = -1

  function reset(initial: unknown) {
    stack = [initial]
    cursor = 0
  }

  function push(json: unknown) {
    // 丢弃 cursor 之后的 redo 分支
    stack = stack.slice(0, cursor + 1)
    stack.push(json)
    if (stack.length > MAX) stack.shift()
    cursor = stack.length - 1
  }

  function undo() {
    if (cursor <= 0) return null
    cursor--
    return stack[cursor]
  }

  function redo() {
    if (cursor >= stack.length - 1) return null
    cursor++
    return stack[cursor]
  }

  function canUndo() {
    return cursor > 0
  }
  function canRedo() {
    return cursor < stack.length - 1
  }

  return { reset, push, undo, redo, canUndo, canRedo }
}
