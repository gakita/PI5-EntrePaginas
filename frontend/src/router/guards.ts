// src/router/guards.ts

import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

export function setupGuards(router: Router) {
  router.beforeEach((to) => {
    const auth = useAuthStore()
    
    // -------------- Workaround do login
    const bypassAuth = true

    if (bypassAuth) {
      return
    }

    // -------------------
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { path: '/login' }
    }

    if (to.meta.guest && auth.isAuthenticated) {
      return { path: '/' }
    }
  })
}
