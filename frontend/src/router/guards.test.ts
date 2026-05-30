import { describe, expect, it, vi } from 'vitest'
import type { Router } from 'vue-router'

const authMock = vi.hoisted(() => ({
  isAuthenticated: false,
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    get isAuthenticated() {
      return authMock.isAuthenticated
    },
  }),
}))

import { resolveAuthRedirect, setupGuards } from './guards'

describe('resolveAuthRedirect', () => {
  it('allows authenticated users into protected routes', () => {
    expect(resolveAuthRedirect({ meta: { requiresAuth: true } }, true)).toBeUndefined()
  })

  it('allows anonymous users into guest routes', () => {
    expect(resolveAuthRedirect({ meta: { guest: true } }, false)).toBeUndefined()
  })
})

describe('setupGuards', () => {
  it('redirects anonymous users away from protected routes', () => {
    authMock.isAuthenticated = false
    const beforeEach = vi.fn()

    setupGuards({ beforeEach } as unknown as Router)
    const guard = beforeEach.mock.calls[0][0]

    expect(guard({ meta: { requiresAuth: true } })).toEqual({ path: '/login' })
  })

  it('redirects authenticated users away from guest routes', () => {
    authMock.isAuthenticated = true
    const beforeEach = vi.fn()

    setupGuards({ beforeEach } as unknown as Router)
    const guard = beforeEach.mock.calls[0][0]

    expect(guard({ meta: { guest: true } })).toEqual({ path: '/' })
  })
})
