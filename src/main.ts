import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

import App from './App.vue'
import { router } from './router'
import './styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(MotionPlugin)
app.use(FloatingVue)

app.mount('#app')
