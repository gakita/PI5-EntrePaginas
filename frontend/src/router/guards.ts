// src/router/guards.ts

import type { RouteLocationNormalized, Router } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

export function resolveAuthRedirect(
  to: Pick<RouteLocationNormalized, 'meta'>,
  isAuthenticated: boolean,
) {
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { path: '/login' }
  }

  if (to.meta.guest && isAuthenticated) {
    return { path: '/' }
  }

  return undefined
}

export function setupGuards(router: Router) {
  router.beforeEach((to) => {
    const auth = useAuthStore()
    return resolveAuthRedirect(to, auth.isAuthenticated)
  })
}
