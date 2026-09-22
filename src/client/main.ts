import { createApp } from 'vue'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(FloatingVue, {
  themes: {
    'info-tooltip': {
      $extend: 'tooltip',
      $resetCss: false,
    },
  },
})
app.mount('#app')
