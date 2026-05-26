<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/authStore'
  import bookmarkIcon from '../assets/Bookmark-favorites_2.svg'
  import profileIcon from '../assets/Icone_perfil.svg'
  import logo from '../assets/Logo_EntrePaginas.svg'

  const router = useRouter()
  const auth = useAuthStore()

  const navLinks = [
    { label: 'ÍNICIO', to: '/' },
    { label: 'CATEGORIAS', to: '/categorias' },
    { label: 'RECOMENDAÇÕES', to: '/recomendacoes' },
    { label: 'CATÁLOGO', to: '/catalogo' },
  ]

  const isLoggedIn = computed(() => Boolean(auth.token))

  const userMenuItems = [
    { label: 'Perfil', to: '/perfil', icon: 'mdi-account-outline' },
    { label: 'Sair', action: handleLogout, icon: 'mdi-logout' },
  ]

  function handleLogout () {
    auth.clearToken()
    void router.push('/login')
  }
</script>

<template>
  <v-app-bar flat>
    <v-app-bar-title>
      <router-link to="/">
        <v-img alt="Entre Páginas" :src="logo" />
      </router-link>
    </v-app-bar-title>

    <template #append>
      <div class="nav-links">
        <template v-for="link in navLinks" :key="link.to">
          <router-link :exact="link.to === '/'" :to="link.to">{{ link.label }}</router-link>
          <span class="nav-separator" />
        </template>
      </div>

      <div class="actions">
        <template v-if="!isLoggedIn">
          <v-btn
            class="login-btn"
            :to="'/login'"
            variant="outlined"
          >
            Entrar
          </v-btn>
        </template>

        <template v-else>
          <div class="bookmark-container">
            <v-btn
              class="action-btn"
              icon
              :to="'/favoritos'"
              :ripple="false"
              variant="plain"
            >
              <v-img class="bookmark-icon" :src="bookmarkIcon" width="66" />
            </v-btn>
          </div>

          <span class="nav-separator" />

          <v-menu location="bottom end" transition="fade-transition">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                class="user-btn-container"
                icon
              >
                <v-avatar size="40">
                  <v-img alt="Profile" :src="profileIcon" />
                </v-avatar>
              </v-btn>
            </template>

            <v-list class="user-menu">
              <v-list-item
                v-for="item in userMenuItems"
                :key="item.label"
                :prepend-icon="item.icon"
                :title="item.label"
                :to="item.to"
                @click="item.action?.()"
              />
            </v-list>
          </v-menu>
        </template>
      </div>
    </template>
  </v-app-bar>
</template>

<style scoped>
.v-app-bar {
  background-color: rgb(var(--v-theme-background)) !important;
  border-bottom: 3px solid rgba(155, 138, 117, 0.25) !important;
  height: 65px !important;
  padding-inline: 38px;
  overflow: visible !important;
}

.v-app-bar :deep(.v-toolbar__content) {
  height: 65px !important;
  align-items: center;
  overflow: visible !important;
  position: relative;
}

.v-app-bar-title {
  flex: 0 0 auto;
}

.v-app-bar-title :deep(.v-img) {
  width: 100px;
  height: 35px;
  object-fit: contain;
}

.v-app-bar-title a {
  display: flex;
  text-decoration: none;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 22px;
}

.nav-links a {
  font-family: "Neuton", serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0.5px;
  color: rgb(var(--v-theme-secondary));
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.nav-links a:hover {
  color: rgb(var(--v-theme-on-background));
}

.nav-links a.router-link-active,
.nav-links a.router-link-exact-active {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  position: relative;
}

.nav-links a.router-link-active::after,
.nav-links a.router-link-exact-active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: rgb(var(--v-theme-primary));
  border-radius: 1px;
}

.nav-separator {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: rgba(155, 138, 117, 0.25);
  flex-shrink: 0;
}

.actions {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-left: 24px;
}

.bookmark-container {
  position: static;
  width: 58px;
  height: 78px;
  display: flex;
  align-items: center;
  overflow: visible;
}

.action-btn {
  position: absolute;
  top: -18px;
  width: 58px !important;
  height: 110px !important;
  min-width: 0 !important;
  min-height: 0 !important;
  border-radius: 0 !important;
  padding: 0 !important;
  overflow: visible !important;
  opacity: 1 !important;
}

.action-btn :deep(.v-btn__overlay),
.action-btn :deep(.v-ripple__container) {
  display: none !important;
}

.action-btn :deep(.v-btn__content) {
  height: 124px;
  overflow: visible;
}

.bookmark-icon {
  transform: translateY(-32px) scale(1.14);
  transform-origin: top center;
  transition: filter 0.2s ease;
}

.action-btn:hover .bookmark-icon,
.action-btn.v-btn--active .bookmark-icon {
  filter: brightness(1.30);
}

.user-btn-container {
  width: 36px !important;
  height: 36px !important;
}

.login-btn {
  font-family: "Playfair Display", serif;
  font-size: 16px;
  color: rgb(var(--v-theme-primary)) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
  text-transform: none;
  letter-spacing: 0.5px;
  margin-right: 8px;
}

.user-btn {
  color: rgb(var(--v-theme-secondary)) !important;
  margin-right: 8px;
}

.user-btn:hover {
  color: rgb(var(--v-theme-primary)) !important;
}

.user-menu {
  background-color: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(155, 138, 117, 0.25);
  min-width: 160px;
}

.user-menu :deep(.v-list-item) {
  font-family: "Playfair Display", serif;
  color: rgb(var(--v-theme-on-surface));
}

.user-menu :deep(.v-list-item:hover) {
  background-color: rgba(201, 162, 39, 0.08) !important;
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
