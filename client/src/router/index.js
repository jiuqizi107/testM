import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '统计仪表盘', icon: 'DataAnalysis' }
      },
      {
        path: 'workbench',
        name: 'Workbench',
        component: () => import('@/views/workbench/index.vue'),
        meta: { title: '测试工作台', icon: 'User' }
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/projects/index.vue'),
        meta: { title: '项目管理', icon: 'Folder' }
      },
      {
        path: 'requirements',
        name: 'Requirements',
        component: () => import('@/views/requirements/index.vue'),
        meta: { title: '需求管理', icon: 'Document' }
      },
      {
        path: 'versions',
        name: 'Versions',
        component: () => import('@/views/versions/index.vue'),
        meta: { title: '版本管理', icon: 'Collection' }
      },
      {
        path: 'returns',
        name: 'Returns',
        component: () => import('@/views/returns/index.vue'),
        meta: { title: '退回台账', icon: 'RefreshLeft' }
      },
      {
        path: 'testcases',
        name: 'TestCases',
        component: () => import('@/views/testcases/index.vue'),
        meta: { title: '测试用例库', icon: 'Tickets' }
      },
      {
        path: 'defects',
        name: 'Defects',
        component: () => import('@/views/defects/index.vue'),
        meta: { title: '缺陷库', icon: 'Warning' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth !== false && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
