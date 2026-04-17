<script setup lang="ts">
import { ref } from 'vue'
import logo from "../assets/Logo.png"

const navLinks = [
  { label: 'Início',        to: '/' },
  { label: 'Categorias',    to: '/categorias' },
  { label: 'Recomendações', to: '/recomendacoes' },
  { label: 'Catálogo',      to: '/catalogo' },
]

// TODO: substituir por authStore.isLoggedIn quando o store existir
const isLoggedIn = ref(false)

const userMenuItems = [
  { label: 'Perfil',  to: '/perfil',  icon: 'mdi-account-outline' },
  { label: 'Sair',    to: '/logout',  icon: 'mdi-logout'           },
]
</script>

<template>
  <v-app-bar flat>
    <v-app-bar-title>
      <router-link to="/">
        <v-img :src="logo" alt="Entre Páginas" />
      </router-link>
    </v-app-bar-title>

    <div class="nav-links">
      <template v-for="(link, index) in navLinks" :key="link.to">
        <router-link :to="link.to" :exact="link.to === '/'">{{ link.label }}</router-link>
        <span v-if="index < navLinks.length - 1" class="nav-separator" />
      </template>
    </div>

    <template #append>
      <template v-if="!isLoggedIn">
        <v-btn
          variant="outlined"
          class="login-btn"
          :to="'/login'"
        >
          Entrar
        </v-btn>
      </template>

      <template v-else>
        <v-menu location="bottom end" transition="fade-transition">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-account-circle-outline"
              class="user-btn"
            />
          </template>

          <v-list class="user-menu">
            <v-list-item
              v-for="item in userMenuItems"
              :key="item.to"
              :to="item.to"
              :prepend-icon="item.icon"
              :title="item.label"
            />
          </v-list>
        </v-menu>
      </template>
    </template>
  </v-app-bar>
</template>

<style scoped>
.v-app-bar {
  background-color: rgb(var(--v-theme-background)) !important;
  border-bottom: 3px solid rgba(155, 138, 117, 0.25) !important;
  height: 94px !important;
  padding-inline: 38px;
}

.v-app-bar :deep(.v-toolbar__content) {
  height: 94px !important;
  align-items: center;
}

.v-app-bar-title {
  flex: 0 0 auto;
}

.v-app-bar-title :deep(.v-img) {
  width: 147px;
  height: 47px;
  object-fit: contain;
}

.v-app-bar-title a {
  display: flex;
  text-decoration: none;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 40px;
  flex: 1;
  justify-content: center;
}

.nav-links a {
  font-family: "Playfair Display", serif;
  font-size: 20px;
  font-weight: 400;
  line-height: 29px;
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
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(155, 138, 117, 0.25);
  flex-shrink: 0;
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