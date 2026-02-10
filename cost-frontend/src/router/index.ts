import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      redirect: '/projects',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'projects',
          name: 'projects',
          component: () => import('../views/ProjectListView.vue')
        },
        {
          path: 'projects/:id',
          name: 'project-detail',
          component: () => import('../views/ProjectDetailView.vue')
        },
        {
          path: 'projects/:id/versions/:versionId',
          name: 'version-workspace',
          component: () => import('../views/VersionWorkspaceView.vue')
        },
        {
          path: 'templates',
          name: 'templates',
          component: () => import('../views/TemplateListView.vue')
        },
        {
          path: 'templates/:id',
          name: 'template-detail',
          component: () => import('../views/TemplateDetailView.vue')
        },
        {
          path: 'tasks',
          name: 'tasks',
          component: () => import('../views/TaskListView.vue')
        },
        {
          path: 'workflows',
          name: 'workflows',
          component: () => import('../views/WorkflowListView.vue')
        },
        {
          path: 'workflows/:id',
          name: 'workflow-detail',
          component: () => import('../views/WorkflowDetailView.vue')
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UserManagementView.vue')
        }
      ]
    },
    {
      path: '/auth',
      component: () => import('../layouts/AuthLayout.vue'),
      meta: { requiresAuth: false },
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('../views/LoginView.vue')
        },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: () => import('../views/ForgotPasswordView.vue')
        }
      ]
    },
    // Redirect legacy routes or handle 404
    {
      path: '/login',
      redirect: '/auth/login'
    },
    {
      path: '/forgot-password',
      redirect: '/auth/forgot-password'
    }
  ]
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth state
  authStore.initializeAuth()
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth === true)
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    next('/auth/login')
    return
  }
  if (to.path.startsWith('/auth') && isAuthenticated) {
    next('/projects')
    return
  }
  next()
})

export default router