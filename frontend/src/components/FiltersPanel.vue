<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  groups?: string[]
}>(), {
  groups: () => [],
})

const searchFilters = ref('')
const authorSearch = ref('')
const publisherSearch = ref('')
const yearFrom = ref('')
const yearTo = ref('')
const expandedGroup = ref<string | null>(null)
const selectedOrder = ref('')
const selectedFilters = ref<Record<string, string[]>>({})

type FilterOption = {
  key: string
  label: string
}

const orderOptions = [
  'Mais antigos',
  'Mais novos',
  'Popularidade',
  'Mais recomendados',
]

const yearRangeOptions: FilterOption[] = [
  { key: 'ate-1950', label: 'Até 1950' },
  { key: '1951-1980', label: '1951-1980' },
  { key: '1981-2000', label: '1981-2000' },
  { key: '2001-2015', label: '2001-2015' },
  { key: '2016+', label: '2016+' },
]

const filterOptions: Record<string, FilterOption[]> = {
  'Gênero': [
    { key: 'comedia', label: 'Comédia' },
    { key: 'terror', label: 'Terror' },
    { key: 'romance', label: 'Romance' },
    { key: 'etc-1', label: 'ETC' },
    { key: 'etc-2', label: 'ETC' },
    { key: 'etc-3', label: 'ETC' },
  ],
  'Tipo': [
    { key: 'etc-1', label: 'ETC' },
    { key: 'etc-2', label: 'ETC' },
    { key: 'etc-3', label: 'ETC' },
    { key: 'etc-4', label: 'ETC' },
    { key: 'etc-5', label: 'ETC' },
    { key: 'etc-6', label: 'ETC' },
  ],
  'Editora': [
    { key: 'etc-1', label: 'ETC' },
    { key: 'etc-2', label: 'ETC' },
    { key: 'etc-3', label: 'ETC' },
    { key: 'etc-4', label: 'ETC' },
    { key: 'etc-5', label: 'ETC' },
    { key: 'etc-6', label: 'ETC' },
  ],
  'Autor': [
    { key: 'etc-1', label: 'ETC' },
    { key: 'etc-2', label: 'ETC' },
    { key: 'etc-3', label: 'ETC' },
    { key: 'etc-4', label: 'ETC' },
    { key: 'etc-5', label: 'ETC' },
    { key: 'etc-6', label: 'ETC' },
  ],
  'Ano': [
    { key: 'etc-1', label: 'ETC' },
    { key: 'etc-2', label: 'ETC' },
    { key: 'etc-3', label: 'ETC' },
    { key: 'etc-4', label: 'ETC' },
    { key: 'etc-5', label: 'ETC' },
    { key: 'etc-6', label: 'ETC' },
  ],
}

function toggleGroup(label: string) {
  if (label === 'Ordenar por') {
    expandedGroup.value = expandedGroup.value === label ? null : label
    return
  }

  expandedGroup.value = expandedGroup.value === label ? null : label
}

function selectOrder(label: string) {
  selectedOrder.value = label
}

function toggleFilterOption(groupLabel: string, optionKey: string) {
  const currentValues = selectedFilters.value[groupLabel] ?? []
  const nextValues = currentValues.includes(optionKey)
    ? currentValues.filter(value => value !== optionKey)
    : [...currentValues, optionKey]

  selectedFilters.value = {
    ...selectedFilters.value,
    [groupLabel]: nextValues,
  }
}

function isFilterSelected(groupLabel: string, optionKey: string) {
  return (selectedFilters.value[groupLabel] ?? []).includes(optionKey)
}

function isYearRangeInvalid() {
  if (!yearFrom.value || !yearTo.value) return false

  return Number(yearFrom.value) > Number(yearTo.value)
}
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
      <div v-for="label in props.groups" :key="label" class="filters-panel__section">
        <button
          class="filters-panel__group"
          :class="{ 'filters-panel__group--active': expandedGroup === label }"
          type="button"
          :aria-expanded="expandedGroup === label"
          @click="toggleGroup(label)"
        >
          <span>{{ label }}</span>
          <v-icon
            size="18"
            class="filters-panel__chevron"
            :class="{ 'filters-panel__chevron--open': expandedGroup === label }"
          >
            mdi-chevron-down
          </v-icon>
        </button>

        <div v-if="label === 'Ordenar por' && expandedGroup === label" class="filters-panel__options filters-panel__options--sort">
          <button
            v-for="option in orderOptions"
            :key="option"
            class="filters-panel__option"
            :class="{ 'filters-panel__option--selected': selectedOrder === option }"
            type="button"
            @click="selectOrder(option)"
          >
            {{ option }}
          </button>
        </div>

        <div v-else-if="label === 'Autor' && expandedGroup === label" class="filters-panel__author-search">
          <input
            v-model="authorSearch"
            type="text"
            placeholder="Buscar autor"
            aria-label="Buscar autor"
          >
          <v-icon size="20">mdi-magnify</v-icon>
        </div>

        <div v-else-if="label === 'Editora' && expandedGroup === label" class="filters-panel__author-search">
          <input
            v-model="publisherSearch"
            type="text"
            placeholder="Buscar editora"
            aria-label="Buscar editora"
          >
          <v-icon size="20">mdi-magnify</v-icon>
        </div>

        <div v-else-if="label === 'Ano' && expandedGroup === label" class="filters-panel__options filters-panel__options--year">
          <div class="filters-panel__year-ranges">
            <button
              v-for="range in yearRangeOptions"
              :key="`Ano-${range.key}`"
              class="filters-panel__tag"
              :class="{ 'filters-panel__tag--selected': isFilterSelected('Ano', range.key) }"
              type="button"
              @click="toggleFilterOption('Ano', range.key)"
            >
              {{ range.label }}
            </button>
          </div>

          <div class="filters-panel__year-custom">
            <label class="filters-panel__year-field">
              <span>De</span>
              <input
                v-model="yearFrom"
                type="number"
                min="0"
                max="9999"
                placeholder="Ano"
                aria-label="Ano inicial"
              >
            </label>

            <label class="filters-panel__year-field">
              <span>Até</span>
              <input
                v-model="yearTo"
                type="number"
                min="0"
                max="9999"
                placeholder="Ano"
                aria-label="Ano final"
              >
            </label>
          </div>

          <p v-if="isYearRangeInvalid()" class="filters-panel__year-error">
            O ano inicial não pode ser maior que o ano final.
          </p>
        </div>

        <div v-else-if="expandedGroup === label" class="filters-panel__options filters-panel__options--grid">
          <button
            v-for="(option, index) in (filterOptions[label] ?? [])"
            :key="`${label}-${option.key}-${index}`"
            class="filters-panel__tag"
            :class="{ 'filters-panel__tag--selected': isFilterSelected(label, option.key) }"
            type="button"
            @click="toggleFilterOption(label, option.key)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
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

.filters-panel__group--active {
  background: #c9a227;
  color: #1f150a;
  border-color: rgba(201, 162, 39, 0.9);
}

.filters-panel__group--active:hover {
  background: #c9a227;
}

.filters-panel__chevron {
  transition: transform 0.2s ease;
}

.filters-panel__chevron--open {
  transform: rotate(180deg);
}

.filters-panel__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filters-panel__options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filters-panel__options--grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;
}

.filters-panel__options--sort {
  margin-top: 2px;
}

.filters-panel__options--year {
  gap: 12px;
}

.filters-panel__year-ranges {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.filters-panel__year-ranges .filters-panel__tag:last-child {
  grid-column: span 2;
}

.filters-panel__year-custom {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.filters-panel__year-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filters-panel__year-field span {
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 15px;
  line-height: 1;
}

.filters-panel__year-field input {
  width: 100%;
  min-height: 42px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 10px;
  background: rgba(42, 31, 20, 0.75);
  color: #e8d5b7;
  padding: 0 10px;
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  outline: none;
}

.filters-panel__year-field input::placeholder {
  color: #9b8a75;
}

.filters-panel__year-error {
  margin: 0;
  color: #e5b2a0;
  font-family: 'Playfair Display', serif;
  font-size: 14px;
}

.filters-panel__author-search {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 48px;
  padding-inline: 14px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 12px;
  background: rgba(42, 31, 20, 0.75);
  color: #e8d5b7;
  box-sizing: border-box;
}

.filters-panel__author-search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  min-width: 0;
}

.filters-panel__author-search input::placeholder {
  color: #9b8a75;
}

.filters-panel__option {
  min-height: 38px;
  padding: 6px 12px;
  border: 1px solid rgba(232, 213, 183, 0.18);
  border-radius: 10px;
  background: rgba(34, 25, 16, 0.6);
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.filters-panel__option:hover {
  background: rgba(54, 40, 26, 0.85);
}

.filters-panel__option--selected {
  background: rgba(201, 162, 39, 0.92);
  border-color: rgba(201, 162, 39, 0.98);
  color: #1f150a;
}

.filters-panel__option--selected:hover {
  background: rgba(201, 162, 39, 0.98);
  color: #1f150a;
}

.filters-panel__tag {
  min-height: 48px;
  padding: 8px 14px;
  border: 1px solid rgba(232, 213, 183, 0.2);
  border-radius: 12px;
  background: rgba(34, 25, 16, 0.62);
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 400;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.filters-panel__tag:hover {
  background: rgba(54, 40, 26, 0.82);
  transform: translateY(-1px);
}

.filters-panel__tag--selected {
  background: rgba(201, 162, 39, 0.92);
  border-color: rgba(201, 162, 39, 0.98);
  color: #1f150a;
}

.filters-panel__tag--selected:hover {
  background: rgba(201, 162, 39, 0.98);
  color: #1f150a;
}

@media (max-width: 1400px) {
  .filters-panel__clear {
    font-size: 18px;
  }

  .filters-panel__search input,
  .filters-panel__group {
    font-size: 20px;
  }

  .filters-panel__option {
    font-size: 15px;
  }

  .filters-panel__tag {
    min-height: 46px;
    font-size: 16px;
  }

  .filters-panel__author-search input {
    font-size: 16px;
  }

  .filters-panel__year-field input {
    min-height: 40px;
    font-size: 15px;
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

  .filters-panel__option {
    min-height: 36px;
    font-size: 14px;
  }

  .filters-panel__options--grid {
    gap: 12px;
  }

  .filters-panel__tag {
    min-height: 44px;
    font-size: 15px;
    padding: 7px 10px;
  }

  .filters-panel__author-search {
    min-height: 44px;
    padding-inline: 10px;
  }

  .filters-panel__author-search input {
    font-size: 15px;
  }

  .filters-panel__year-ranges,
  .filters-panel__year-custom {
    gap: 10px;
  }

  .filters-panel__year-field span {
    font-size: 14px;
  }

  .filters-panel__year-field input {
    min-height: 38px;
    font-size: 14px;
  }

  .filters-panel__year-error {
    font-size: 13px;
  }
}
</style>
