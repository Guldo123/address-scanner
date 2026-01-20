import { createRouter, createWebHashHistory } from 'vue-router'
import Scanner from '../pages/Scanner.vue'
import History from '../pages/History.vue'

const routes = [
  {
    path: '/',
    name: 'Scanner',
    component: Scanner
  },
  {
    path: '/history',
    name: 'History',
    component: History
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
