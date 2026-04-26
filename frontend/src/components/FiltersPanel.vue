<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  groups?: string[]
}>(), {
  groups: () => [],
})

const searchFilters = ref('')
</script>

<template>
  <aside class="filters-panel">
    <div class="filters-panel__top">
      <button class="filters-panel__clear" type="button">
        <v-icon size="26">mdi-close</v-icon>
        Limpar filtros
      </button>

      <div class="filters-panel__search">
        <input
          v-model="searchFilters"
          type="text"
          placeholder=""
          aria-label="Buscar filtros"
        >
        <v-icon size="24">mdi-magnify</v-icon>
      </div>
    </div>

    <div class="filters-panel__list">
      <button
        v-for="label in props.groups"
        :key="label"
        class="filters-panel__group"
        type="button"
      >
        <span>{{ label }}</span>
        <v-icon size="18">mdi-chevron-down</v-icon>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.filters-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 16px 16px 22px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 15px;
  background: rgba(26, 18, 11, 0.75);
  box-shadow: 0 6px 3px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.filters-panel__top {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  margin-bottom: 12px;
}

.filters-panel__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.filters-panel__list::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.filters-panel__clear {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 2px;
  border: none;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: #c9a227;
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  width: fit-content;
  transition: border-color 0.2s ease;
}

.filters-panel__clear:hover {
  border-bottom-color: currentcolor;
}

.filters-panel__search,
.filters-panel__group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 52px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 15px;
  background: rgba(42, 31, 20, 0.75);
  color: #e8d5b7;
  box-sizing: border-box;
}

.filters-panel__search {
  padding-inline: 14px;
}

.filters-panel__search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  min-width: 0;
}

.filters-panel__group {
  border: 1px solid rgba(232, 213, 183, 0.25);
  padding: 10px 14px;
  cursor: pointer;
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 600;
  text-align: left;
  transition: background-color 0.2s ease;
}

.filters-panel__group:hover {
  background: rgba(54, 40, 26, 0.8);
}

@media (max-width: 1400px) {
  .filters-panel__clear {
    font-size: 18px;
  }

  .filters-panel__search input,
  .filters-panel__group {
    font-size: 20px;
  }
}

@media (max-width: 760px) {
  .filters-panel {
    padding: 16px;
  }

  .filters-panel__search,
  .filters-panel__group {
    min-height: 54px;
  }

  .filters-panel__search input,
  .filters-panel__group {
    font-size: 18px;
  }
}
</style>
