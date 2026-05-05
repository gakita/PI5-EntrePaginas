// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    {
      path: '/',
      component: () => import('@/pages/home.vue'),
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
    {
      path: '/catalogo',
      component: () => import('@/pages/Catalogo.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/livros/:id',
      component: () => import('@/pages/BookDescPage.vue'),
      meta: { requiresAuth: true },
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
