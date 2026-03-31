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
      // ========== 项目类测试模块 ==========
      {
        path: 'project-test',
        name: 'ProjectTest',
        meta: { title: '项目类测试', icon: 'FolderOpened' },
        children: [
          {
            path: 'projects',
            name: 'Projects',
            component: () => import('@/views/projects/index.vue'),
            meta: { title: '项目管理' }
          },
          {
            path: 'testcases-project',
            name: 'ProjectTestCases',
            component: () => import('@/views/testcases-project/index.vue'),
            meta: { title: '项目用例库' }
          }
        ]
      },
      // ========== 日常需求测试模块 ==========
      {
        path: 'daily-test',
        name: 'DailyTest',
        meta: { title: '日常需求测试', icon: 'Document' },
        children: [
          {
            path: 'versions',
            name: 'Versions',
            component: () => import('@/views/versions/index.vue'),
            meta: { title: '版本管理' }
          },
          {
            path: 'requirements',
            name: 'Requirements',
            component: () => import('@/views/requirements/index.vue'),
            meta: { title: '需求管理' }
          },
          {
            path: 'testcases-daily',
            name: 'DailyTestCases',
            component: () => import('@/views/testcases-daily/index.vue'),
            meta: { title: '日常用例库' }
          }
        ]
      },
      // ========== 公共模块 ==========
      {
        path: 'defects',
        name: 'Defects',
        component: () => import('@/views/defects/index.vue'),
        meta: { title: '缺陷库', icon: 'Warning' }
      },
      {
        path: 'returns',
        name: 'Returns',
        component: () => import('@/views/returns/index.vue'),
        meta: { title: '退回台账', icon: 'RefreshLeft' }
      },
      {
        path: 'systems',
        name: 'Systems',
        component: () => import('@/views/systems/index.vue'),
        meta: { title: '系统字典', icon: 'Setting' }
      },
      {
        path: 'post-production-issues',
        name: 'PostProductionIssues',
        component: () => import('@/views/post-production-issues/index.vue'),
        meta: { title: '产后问题复盘', icon: 'WarningFilled' }
      },
      // 报表模块
      {
        path: 'reports',
        name: 'Reports',
        meta: { title: '报表管理', icon: 'DataBoard' },
        children: [
          {
            path: 'weekly-reports',
            name: 'WeeklyReports',
            component: () => import('@/views/weekly-reports/index.vue'),
            meta: { title: '测试室周报' }
          },
          {
            path: 'personal-reports',
            name: 'PersonalReports',
            component: () => import('@/views/personal-reports/index.vue'),
            meta: { title: '个人工作汇报' }
          }
        ]
      },
      // 测试资产库
      {
        path: 'test-assets',
        name: 'TestAssets',
        meta: { title: '测试资产库', icon: 'Box' },
        children: [
          {
            path: 'asset-list',
            name: 'AssetList',
            component: () => import('@/views/test-assets/index.vue'),
            meta: { title: '资产列表' }
          },
          {
            path: 'experience-list',
            name: 'ExperienceList',
            component: () => import('@/views/test-experiences/index.vue'),
            meta: { title: '测试经验库' }
          }
        ]
      },
      // AI功能
      {
        path: 'ai-tools',
        name: 'AITools',
        meta: { title: 'AI智能助手', icon: 'MagicStick' },
        children: [
          {
            path: 'ai-generate',
            name: 'AIGenerate',
            component: () => import('@/views/ai-generate/index.vue'),
            meta: { title: 'AI用例生成' }
          },
          {
            path: 'ai-check',
            name: 'AICheck',
            component: () => import('@/views/ai-check/index.vue'),
            meta: { title: 'AI用例检查' }
          }
        ]
      },
      // 系统管理
      {
        path: 'system',
        name: 'System',
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          {
            path: 'user-management',
            name: 'UserManagement',
            component: () => import('@/views/user-management/index.vue'),
            meta: { title: '用户与权限' }
          },
          {
            path: 'systems',
            name: 'Systems',
            component: () => import('@/views/systems/index.vue'),
            meta: { title: '系统字典' }
          }
        ]
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
