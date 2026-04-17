// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    {
      path: '/',
      component: () => import('@/pages/Home.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      component: () => import('@/pages/Login.vue'),
      meta: { guest: true },
    },
    {
      path: '/registrar',
      component: () => import('@/pages/Register.vue'),
      meta: { guest: true },
    },

    // // Protected routes
    // {
    //   path: '/perfil',
    //   component: () => import('@/pages/Profile.vue'),
    //   meta: { requiresAuth: true },
    // },
    // {
    //   path: '/preferencias',
    //   component: () => import('@/pages/Preferences.vue'),
    //   meta: { requiresAuth: true },
    // },
    // {
    //   path: '/historico',
    //   component: () => import('@/pages/History.vue'),
    //   meta: { requiresAuth: true },
    // },
    // {
    //   path: '/recomendacoes',
    //   component: () => import('@/pages/Recommendations.vue'),
    //   meta: { requiresAuth: true },
    // },
  ],
})

setupGuards(router)

export default router
