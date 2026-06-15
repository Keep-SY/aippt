/**
 * 跨编辑器组件共享的 Fabric API（通过 provide/inject 传递）
 * 这样子组件不必通过 props 一层层传 api
 */
import type { InjectionKey } from 'vue'
import type { FabricApi } from '@/composables/useFabricCanvas'

export const FabricApiKey: InjectionKey<FabricApi> = Symbol('FabricApi')
