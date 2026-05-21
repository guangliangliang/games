import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import './style.css'

// 定义路由
const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/gomoku', name: 'Gomoku', component: () => import('./views/Gomoku.vue') },
  { path: '/snake', name: 'Snake', component: () => import('./views/Snake.vue') },
  { path: '/dialog-demo', name: 'DialogDemo', component: () => import('./views/DialogDemo.vue') }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 创建并挂载应用
const app = createApp(App)
app.use(router)
app.mount('#app')
