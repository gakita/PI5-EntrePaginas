<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'

export interface BookFilters {
  search?: string
  author?: string
  publisher?: string
  orderBy?: 'newest' | 'oldest' | 'relevance'
  yearFrom?: number
  yearTo?: number
}

const props = withDefaults(defineProps<{
  groups?: string[]
  title?: string
}>(), {
  groups: () => [],
  title: 'Filtros',
})

const emit = defineEmits<{
  filtersChange: [filters: BookFilters]
}>()

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

const orderMap: Record<string, BookFilters['orderBy']> = {
  'Mais antigos': 'oldest',
  'Mais novos': 'newest',
  Popularidade: 'relevance',
  'Mais recomendados': 'relevance',
}

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
  } else {
    expandedGroup.value = expandedGroup.value === label ? null : label
  }

  // Faz scroll automático quando expande
  if (expandedGroup.value) {
    nextTick(() => {
      const section = document.querySelector(
        `[data-filter-label="${label}"]`
      )
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    })
  }
}

function selectOrder(label: string) {
  selectedOrder.value = selectedOrder.value === label ? '' : label
}

function clearFilters() {
  // reseta inputs de texto
  searchFilters.value = ''
  authorSearch.value = ''
  publisherSearch.value = ''
  yearFrom.value = ''
  yearTo.value = ''

  // reseta seleções
  selectedOrder.value = ''
  selectedFilters.value = {}

  expandedGroup.value = null

  //scrolla de volta pra cima
  nextTick(() => {
    const list = document.querySelector('.filters-panel__list') as HTMLElement | null
    if (list) list.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function toggleFilterOption(groupLabel: string, optionKey: string) {
  const currentValues = selectedFilters.value[groupLabel] ?? []
  const nextValues = groupLabel === 'Ano'
    ? (currentValues.includes(optionKey) ? [] : [optionKey])
    : (currentValues.includes(optionKey)
        ? currentValues.filter(value => value !== optionKey)
        : [...currentValues, optionKey])

  selectedFilters.value = {
    ...selectedFilters.value,
    [groupLabel]: nextValues,
  }
  // If the user selected a predefined year chip, clear custom year inputs
  clearYearInputsIfChipSelected(groupLabel, nextValues)
}

// When a year-range chip is selected, clear any custom year inputs (De/Até)
function clearYearInputsIfChipSelected(groupLabel: string, nextValues: string[]) {
  if (groupLabel === 'Ano' && (yearFrom.value !== '' || yearTo.value !== '')) {
    yearFrom.value = ''
    yearTo.value = ''
  }
}

// Watch custom year inputs and deselect any predefined year-range chips if user types
watch([yearFrom, yearTo], ([from, to]) => {
  const hasCustom = (from !== '' && from !== null) || (to !== '' && to !== null)
  if (hasCustom) {
    const current = selectedFilters.value['Ano'] ?? []
    if (current.length) {
      selectedFilters.value = {
        ...selectedFilters.value,
        Ano: [],
      }
    }
  }
})

function isFilterSelected(groupLabel: string, optionKey: string) {
  return (selectedFilters.value[groupLabel] ?? []).includes(optionKey)
}

function isYearRangeInvalid() {
  if (!yearFrom.value || !yearTo.value) return false

  return Number(yearFrom.value) > Number(yearTo.value)
}

function getYearRangeFromChip(optionKey?: string) {
  switch (optionKey) {
    case 'ate-1950':
      return { yearTo: 1950 }
    case '1951-1980':
      return { yearFrom: 1951, yearTo: 1980 }
    case '1981-2000':
      return { yearFrom: 1981, yearTo: 2000 }
    case '2001-2015':
      return { yearFrom: 2001, yearTo: 2015 }
    case '2016+':
      return { yearFrom: 2016 }
    default:
      return {}
  }
}

function normalizeText(value: string) {
  return value.trim() || undefined
}

function buildFilters(): BookFilters {
  const selectedYear = selectedFilters.value['Ano']?.[0]
  const chipYearRange = getYearRangeFromChip(selectedYear)
  const customYearFrom = yearFrom.value ? Number(yearFrom.value) : undefined
  const customYearTo = yearTo.value ? Number(yearTo.value) : undefined
  const hasValidCustomYear = !isYearRangeInvalid() && (customYearFrom || customYearTo)

  return {
    search: normalizeText(searchFilters.value),
    author: normalizeText(authorSearch.value),
    publisher: normalizeText(publisherSearch.value),
    orderBy: selectedOrder.value ? orderMap[selectedOrder.value] : undefined,
    yearFrom: hasValidCustomYear ? customYearFrom : chipYearRange.yearFrom,
    yearTo: hasValidCustomYear ? customYearTo : chipYearRange.yearTo,
  }
}

let filtersEmitTimer: ReturnType<typeof window.setTimeout> | undefined

watch(
  [searchFilters, authorSearch, publisherSearch, yearFrom, yearTo, selectedOrder, selectedFilters],
  () => {
    window.clearTimeout(filtersEmitTimer)
    filtersEmitTimer = window.setTimeout(() => {
      emit('filtersChange', buildFilters())
    }, 350)
  },
  { deep: true },
)
</script>

<template>
  <aside class="filters-panel">
    <h2 class="filters-panel__title">{{ props.title }}</h2>
    <div class="filters-panel__divider" />

    <div class="filters-panel__top">
      <button class="filters-panel__clear" type="button" @click="clearFilters">
        <v-icon size="15">mdi-close</v-icon>
        <span class="filters-panel__clear-label">Limpar filtros</span>
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
      <div v-for="label in props.groups" :key="label" :data-filter-label="label" class="filters-panel__section">
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
  padding: 14px 14px 18px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 15px;
  background: rgba(26, 18, 11, 0.75);
  box-shadow: 0 6px 3px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.filters-panel__title {
  margin: 3px 0 14px;
  font-family: 'Playfair Display', serif;
  font-size: 34px;
  font-weight: 600;
  line-height: 1;
  color: #e8d5b7;
  flex-shrink: 0;
}

.filters-panel__divider {
  height: 1px;
  background: rgba(232, 213, 183, 0.25);
  margin: 0 0 14px;
  flex-shrink: 0;
}

.filters-panel__top {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  margin-bottom: 10px;
}

.filters-panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  gap: 4px;
  border: none;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: #c9a227;
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  width: fit-content;
  transition: border-color 0.2s ease;
}

.filters-panel__clear-label {
  line-height: 1;
  transform: translateY(-1.2px);
  font-size: 13px;
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
  min-height: 40px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 15px;
  background: rgba(42, 31, 20, 0.75);
  color: #e8d5b7;
  box-sizing: border-box;
}

.filters-panel__search {
  padding-inline: 12px;
}

.filters-panel__search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  min-width: 0;
}

.filters-panel__group {
  border: 1px solid rgba(232, 213, 183, 0.25);
  padding: 8px 12px;
  cursor: pointer;
  font-family: 'Playfair Display', serif;
  font-size: 20px;
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
  gap: 6px;
}

.filters-panel__options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filters-panel__options--grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.filters-panel__options--sort {
  margin-top: 0;
}

.filters-panel__options--year {
  gap: 10px;
}

.filters-panel__year-ranges {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.filters-panel__year-ranges .filters-panel__tag:last-child {
  grid-column: span 2;
}

.filters-panel__year-custom {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.filters-panel__year-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filters-panel__year-field span {
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  line-height: 1;
}

.filters-panel__year-field input {
  width: 100%;
  min-height: 36px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 10px;
  background: rgba(42, 31, 20, 0.75);
  color: #e8d5b7;
  padding: 0 10px;
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  outline: none;
}

.filters-panel__year-field input::placeholder {
  color: #9b8a75;
}

.filters-panel__year-error {
  margin: 0;
  color: #e5b2a0;
  font-family: 'Playfair Display', serif;
  font-size: 12px;
}

.filters-panel__author-search {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 40px;
  padding-inline: 12px;
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
  font-size: 14px;
  min-width: 0;
}

.filters-panel__author-search input::placeholder {
  color: #9b8a75;
}

.filters-panel__option {
  min-height: 32px;
  padding: 5px 10px;
  border: 1px solid rgba(232, 213, 183, 0.18);
  border-radius: 10px;
  background: rgba(34, 25, 16, 0.6);
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 14px;
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
  min-height: 38px;
  padding: 6px 10px;
  border: 1px solid rgba(232, 213, 183, 0.2);
  border-radius: 12px;
  background: rgba(34, 25, 16, 0.62);
  color: #e8d5b7;
  font-family: 'Playfair Display', serif;
  font-size: 15px;
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
    font-size: 14px;
  }

  .filters-panel__search input,
  .filters-panel__group {
    font-size: 14px;
    min-height: 34px;
  }

  .filters-panel__option {
    font-size: 13px;
  }

  .filters-panel__tag {
    min-height: 30px;
    font-size: 14px;
  }

  .filters-panel__author-search input {
    font-size: 13px;
  }

  .filters-panel__year-field input {
    min-height: 34px;
    font-size: 13px;
  }
}

@media (max-width: 760px) {
  .filters-panel {
    padding: 14px;
  }

  .filters-panel__search,
  .filters-panel__group {
    min-height: 40px;
  }

  .filters-panel__search input,
  .filters-panel__group {
    font-size: 14px;
  }

  .filters-panel__option {
    min-height: 32px;
    font-size: 12px;
  }

  .filters-panel__options--grid {
    gap: 10px;
  }

  .filters-panel__tag {
    min-height: 36px;
    font-size: 13px;
    padding: 6px 10px;
  }

  .filters-panel__author-search {
    min-height: 38px;
    padding-inline: 10px;
  }

  .filters-panel__author-search input {
    font-size: 13px;
  }

  .filters-panel__year-ranges,
  .filters-panel__year-custom {
    gap: 8px;
  }

  .filters-panel__year-field span {
    font-size: 12px;
  }

  .filters-panel__year-field input {
    min-height: 32px;
    font-size: 12px;
  }

  .filters-panel__year-error {
    font-size: 12px;
  }
}
</style>
