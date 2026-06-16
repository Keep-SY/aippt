import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '智演 AI · AI Slide Studio' }
  },
  {
    path: '/app',
    name: 'landing',
    component: () => import('@/views/LandingView.vue'),
    meta: { title: '开始创作' }
  },
  {
    path: '/outline',
    name: 'outline',
    component: () => import('@/views/OutlineView.vue'),
    meta: { title: '大纲编辑器' }
  },
  {
    path: '/templates',
    name: 'templates',
    component: () => import('@/views/TemplatePickerView.vue'),
    meta: { title: '模板选择' }
  },
  {
    path: '/generating',
    name: 'generating',
    component: () => import('@/views/GeneratingView.vue'),
    meta: { title: '生成中' }
  },
  {
    path: '/editor/:id?',
    name: 'editor',
    component: () => import('@/views/EditorView.vue'),
    meta: { title: '编辑器' }
  },
  {
    path: '/decks',
    name: 'decks',
    component: () => import('@/views/DecksView.vue'),
    meta: { title: '我的演示稿' }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})
