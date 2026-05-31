<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Navbar from '@/components/Navbar.vue'
import fundoImg from '@/assets/FUNDO.png'
import profileIcon from '@/assets/Icone_perfil.svg'
import { 
  authService, 
  chatService, 
  favoritesService, 
  type CatalogBook
} from '@/services'
import { getBookPlaceholderCover } from '@/utils/bookTaxonomy'

const router = useRouter()
const auth = useAuthStore()

// Estados principais
const user = ref({ name: '', email: '' })
const preferences = ref({
  genres: [] as string[],
  types: [] as string[],
  favoriteAuthors: [] as string[]
})
const favorites = ref<CatalogBook[]>([])

const isLoading = ref(true)
const isSavingPrefs = ref(false)
const isUpdatingProfile = ref(false)
const isChangingPassword = ref(false)
const isDeletingAccount = ref(false)

const profileError = ref('')
const profileSuccess = ref('')
const prefsSuccess = ref('')
const passwordSuccess = ref('')
const deleteError = ref('')

// Controle de abas
const activeTab = ref('preferences')

// Formulários
const editName = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const deleteConfirmPassword = ref('')

// Adicionar Autor Manualmente
const newAuthor = ref('')

// Diálogos de confirmação
const showDeleteDialog = ref(false)

// Gêneros pré-definidos disponíveis para escolha
const availableGenres = [
  { label: 'Fantasia', value: 'fantasia' },
  { label: 'Romance', value: 'romance' },
  { label: 'Terror', value: 'terror' },
  { label: 'Ficção Científica', value: 'ficção científica' },
  { label: 'Mistério', value: 'mistério' },
  { label: 'Suspense', value: 'suspense' },
  { label: 'Biografia', value: 'biografia' },
  { label: 'Drama', value: 'drama' },
  { label: 'Aventura', value: 'aventura' },
]

// Regras de validação
const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minLength: (v: string) => (v && v.length >= 6) || 'Mínimo de 6 caracteres',
  match: (v: string) => v === newPassword.value || 'As senhas não coincidem'
}

onMounted(async () => {
  await loadUserData()
})

async function loadUserData() {
  isLoading.value = true
  profileError.value = ''
  
  try {
    // 1. Dados Pessoais
    const meResponse = await authService.me()
    user.value = {
      name: meResponse.user.name || 'Leitor(a)',
      email: meResponse.user.email
    }
    editName.value = user.value.name

    // 2. Preferências
    try {
      const prefsResponse = await chatService.getPreferences()
      preferences.value = {
        genres: prefsResponse.genres || [],
        types: prefsResponse.types || [],
        favoriteAuthors: prefsResponse.favoriteAuthors || []
      }
    } catch (e) {
      console.warn('Erro ao carregar preferências, usando valores padrão.', e)
    }

    // 3. Livros Favoritos
    try {
      favorites.value = await favoritesService.listFavorites()
    } catch (e) {
      console.warn('Erro ao carregar favoritos.', e)
    }

  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Erro ao carregar dados do perfil.'
  } finally {
    isLoading.value = false
  }
}

// Atualizar nome do usuário
async function handleUpdateProfile() {
  profileSuccess.value = ''
  profileError.value = ''
  if (!editName.value.trim()) return

  isUpdatingProfile.value = true
  try {
    const res = await authService.updateMe({ name: editName.value.trim() })
    user.value.name = res.user.name
    profileSuccess.value = 'Nome atualizado com sucesso!'
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Erro ao atualizar o nome.'
  } finally {
    isUpdatingProfile.value = false
  }
}

// Alterar senha
async function handleUpdatePassword() {
  passwordSuccess.value = ''
  profileError.value = ''
  if (!currentPassword.value || !newPassword.value || newPassword.value !== confirmPassword.value) {
    return
  }

  isChangingPassword.value = true
  try {
    await authService.updateMe({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })
    passwordSuccess.value = 'Senha alterada com sucesso!'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Erro ao atualizar a senha.'
  } finally {
    isChangingPassword.value = false
  }
}

// Excluir conta
async function handleDeleteAccount() {
  deleteError.value = ''
  if (!deleteConfirmPassword.value) return

  isDeletingAccount.value = true
  try {
    await authService.deleteMe({ currentPassword: deleteConfirmPassword.value })
    showDeleteDialog.value = false
    auth.clearToken()
    router.push('/login')
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : 'Senha incorreta. Não foi possível deletar a conta.'
  } finally {
    isDeletingAccount.value = false
  }
}

// Salvar Preferências de Leitura
async function handleSavePreferences() {
  prefsSuccess.value = ''
  isSavingPrefs.value = true
  try {
    await chatService.updatePreferences({
      genres: preferences.value.genres,
      types: preferences.value.types,
      favoriteAuthors: preferences.value.favoriteAuthors
    })
    prefsSuccess.value = 'Preferências salvas com sucesso!'
    setTimeout(() => { prefsSuccess.value = '' }, 4000)
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Erro ao salvar preferências.'
  } finally {
    isSavingPrefs.value = false
  }
}

// Resetar Preferências de Leitura
async function handleResetPreferences() {
  if (!confirm('Deseja realmente resetar suas preferências de leitura?')) return

  isSavingPrefs.value = true
  try {
    await chatService.clearPreferences()
    preferences.value = { genres: [], types: [], favoriteAuthors: [] }
    prefsSuccess.value = 'Preferências resetadas com sucesso!'
    setTimeout(() => { prefsSuccess.value = '' }, 4000)
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Erro ao resetar preferências.'
  } finally {
    isSavingPrefs.value = false
  }
}

// Toggle de Gênero
function toggleGenre(genreValue: string) {
  const index = preferences.value.genres.indexOf(genreValue)
  if (index >= 0) {
    preferences.value.genres.splice(index, 1)
  } else {
    preferences.value.genres.push(genreValue)
  }
}

// Adicionar Autor
function addAuthor() {
  const author = newAuthor.value.trim()
  if (author && !preferences.value.favoriteAuthors.includes(author)) {
    preferences.value.favoriteAuthors.push(author)
    newAuthor.value = ''
  }
}

// Remover Autor
function removeAuthor(author: string) {
  const index = preferences.value.favoriteAuthors.indexOf(author)
  if (index >= 0) {
    preferences.value.favoriteAuthors.splice(index, 1)
  }
}

// Navegar para detalhes do livro
function goToBook(id: string | null) {
  if (id) {
    router.push(`/livros/${id}`)
  }
}
</script>

<template>
  <Navbar />
  <div class="profile-page" :style="{ '--fundo': `url(${fundoImg})` }">
    <div class="profile-page__glow" />

    <v-container class="profile-container py-8">
      <!-- Estado de Carregamento -->
      <div v-if="isLoading" class="d-flex flex-column align-center justify-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" width="6" class="mb-4" />
        <span class="text-subtitle-1 text-secondary">Carregando perfil...</span>
      </div>

      <!-- Conteúdo do Perfil -->
      <v-row v-else class="match-height">
        <!-- Coluna Esquerda: Cabeçalho com Avatar, Infos Básicas e Estatísticas -->
        <v-col cols="12" md="4">
          <v-card class="glass-card profile-card mb-6" flat>
            <div class="profile-card__header py-8 px-4 text-center">
              <v-avatar size="110" class="profile-avatar mb-4">
                <v-img :src="profileIcon" alt="Profile" />
              </v-avatar>
              <h2 class="profile-name text-h5 font-weight-bold text-on-surface">{{ user.name }}</h2>
              <p class="profile-email text-subtitle-2 text-on-surface-variant">{{ user.email }}</p>
            </div>
            
            <v-divider class="mx-4 border-color-soft" />

            <!-- Estatísticas Rápidas -->
            <v-card-text class="py-6">
              <h3 class="text-subtitle-1 font-weight-bold text-primary mb-4 text-center">Resumo de Leitura</h3>
              <v-row class="text-center">
                <v-col cols="12">
                  <div class="text-h4 font-weight-bold text-on-surface">{{ favorites.length }}</div>
                  <div class="text-caption text-secondary uppercase">Favoritos</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Menu de Abas (Navegação Esquerda) -->
          <v-card class="glass-card menu-card" flat>
            <v-list class="bg-transparent" density="comfortable">
              <v-list-item
                :active="activeTab === 'preferences'"
                prepend-icon="mdi-heart-cog-outline"
                title="Preferências de Leitura"
                class="menu-item"
                color="primary"
                @click="activeTab = 'preferences'"
              />
              <v-list-item
                :active="activeTab === 'favorites_list'"
                prepend-icon="mdi-book-multiple-outline"
                title="Meus Favoritos"
                class="menu-item"
                color="primary"
                @click="activeTab = 'favorites_list'"
              />
              <v-list-item
                :active="activeTab === 'settings'"
                prepend-icon="mdi-cog-outline"
                title="Configurações de Conta"
                class="menu-item"
                color="primary"
                @click="activeTab = 'settings'"
              />
            </v-list>
          </v-card>
        </v-col>

        <!-- Coluna Direita: Conteúdo Dinâmico com base na aba ativa -->
        <v-col cols="12" md="8">
          <!-- Alertas de Erro e Sucesso -->
          <v-alert
            v-if="profileError"
            type="error"
            variant="tonal"
            closable
            class="mb-6 font-neuton"
            @click:close="profileError = ''"
          >
            {{ profileError }}
          </v-alert>

          <!-- ABA 1: PREFERÊNCIAS DE LEITURA -->
          <v-card v-if="activeTab === 'preferences'" class="glass-card content-card px-6 py-6" flat>
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <h2 class="section-title text-h5 text-on-surface">Preferências de Leitura</h2>
                <p class="section-subtitle text-caption text-secondary">Ajuste seu perfil literário para que nossa IA forneça as melhores recomendações.</p>
              </div>
            </div>

            <!-- Gêneros Favoritos -->
            <div class="mb-6">
              <h3 class="input-section-title text-subtitle-1 font-weight-bold text-on-surface mb-3">Gêneros Favoritos</h3>
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                  v-for="genre in availableGenres"
                  :key="genre.value"
                  :selected="preferences.genres.includes(genre.value)"
                  class="genre-chip"
                  :class="{ 'is-selected': preferences.genres.includes(genre.value) }"
                  filter
                  variant="outlined"
                  @click="toggleGenre(genre.value)"
                >
                  {{ genre.label }}
                </v-chip>
              </div>
            </div>

            <v-divider class="my-6 border-color-soft" />

            <!-- Autores Favoritos -->
            <div class="mb-8">
              <h3 class="input-section-title text-subtitle-1 font-weight-bold text-on-surface mb-2">Autores Favoritos</h3>
              <p class="text-caption text-secondary mb-4">Adicione seus autores favoritos para personalizar ainda mais o algoritmo de buscas.</p>
              
              <!-- Input para Adicionar Autor -->
              <div class="d-flex gap-3 mb-4">
                <v-text-field
                  v-model="newAuthor"
                  placeholder="Nome do autor (ex: J.R.R. Tolkien, Clarice Lispector)"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  bg-color="#261c12"
                  base-color="#9b8a75"
                  color="#c9a227"
                  class="max-width-field"
                  @keyup.enter="addAuthor"
                />
                <v-btn
                  color="primary"
                  height="48"
                  variant="elevated"
                  prepend-icon="mdi-plus"
                  class="add-btn font-weight-bold text-on-primary"
                  @click="addAuthor"
                >
                  Adicionar
                </v-btn>
              </div>

              <!-- Lista de Autores Adicionados -->
              <div v-if="preferences.favoriteAuthors.length > 0" class="d-flex flex-wrap gap-2">
                <v-chip
                  v-for="author in preferences.favoriteAuthors"
                  :key="author"
                  closable
                  class="author-chip"
                  variant="flat"
                  bg-color="surface"
                  @click:close="removeAuthor(author)"
                >
                  {{ author }}
                </v-chip>
              </div>
              <p v-else class="text-body-2 text-secondary italic">Nenhum autor adicionado ainda.</p>
            </div>

            <!-- Feedback de Sucesso -->
            <v-alert v-if="prefsSuccess" type="success" variant="tonal" density="compact" class="mb-4">
              {{ prefsSuccess }}
            </v-alert>

            <!-- Ações -->
            <div class="d-flex justify-end gap-3">
              <v-btn
                variant="outlined"
                color="error"
                class="font-weight-bold"
                height="48"
                :disabled="isSavingPrefs"
                @click="handleResetPreferences"
              >
                Resetar
              </v-btn>
              <v-btn
                color="primary"
                class="font-weight-bold text-on-primary px-6"
                height="48"
                :loading="isSavingPrefs"
                @click="handleSavePreferences"
              >
                Salvar Preferências
              </v-btn>
            </div>
          </v-card>

          <!-- ABA 2: LISTA DE FAVORITOS -->
          <v-card v-if="activeTab === 'favorites_list'" class="glass-card content-card px-6 py-6" flat>
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <h2 class="section-title text-h5 text-on-surface">Meus Favoritos</h2>
                <p class="section-subtitle text-caption text-secondary">Os livros, HQs e mangás que você marcou como favoritos.</p>
              </div>
            </div>

            <div v-if="favorites.length > 0">
              <div class="favorites-grid">
                <div
                  v-for="(book, index) in favorites"
                  :key="book.googleBooksId || book.title || `favorite-${index}`"
                  class="book-card"
                  @click="goToBook(book.googleBooksId)"
                >
                  <div class="book-card__cover-wrapper">
                    <v-img
                      :src="book.coverUrl || getBookPlaceholderCover(book)"
                      class="book-card__cover"
                      cover
                    >
                      <template #placeholder>
                        <div class="d-flex align-center justify-center fill-height" style="background: #2a1f14;">
                          <v-icon color="primary">mdi-book-open-variant</v-icon>
                        </div>
                      </template>
                    </v-img>
                  </div>
                  <div class="book-card__info py-2 text-center">
                    <h4 class="book-card__title text-body-2 font-weight-bold text-truncate text-on-surface px-1">{{ book.title }}</h4>
                    <p class="book-card__author text-caption text-secondary text-truncate px-1">{{ book.author || 'Autor desconhecido' }}</p>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-center mt-6">
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-open-in-new"
                  to="/favoritos"
                  class="font-weight-bold"
                >
                  Ver mais
                </v-btn>
              </div>
            </div>
            <div v-else class="text-center py-12">
              <v-icon size="64" color="secondary" class="mb-4">mdi-book-open-blank-variant</v-icon>
              <h3 class="text-h6 text-on-surface mb-2">Sua lista de favoritos está vazia</h3>
              <p class="text-body-2 text-secondary mb-6">Explore o catálogo e adicione suas leituras preferidas para vê-las aqui.</p>
              <v-btn color="primary" to="/catalogo" class="text-on-primary font-weight-bold">
                Ir para o Catálogo
              </v-btn>
            </div>
          </v-card>

          <!-- ABA 3: CONFIGURAÇÕES DE CONTA -->
          <v-card v-if="activeTab === 'settings'" class="glass-card content-card px-6 py-6" flat>
            <!-- Detalhes Pessoais -->
            <div class="mb-8">
              <h2 class="section-title text-h5 text-on-surface mb-2">Configurações Pessoais</h2>
              <p class="section-subtitle text-caption text-secondary mb-6">Altere seu nome de exibição no sistema.</p>
              
              <v-form @submit.prevent="handleUpdateProfile">
                <div class="mb-4">
                  <label class="d-block text-subtitle-2 text-on-surface mb-2 font-weight-bold">Nome de Usuário</label>
                  <v-text-field
                    v-model="editName"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    bg-color="#261c12"
                    base-color="#9b8a75"
                    color="#c9a227"
                    class="max-width-field"
                  />
                </div>
                
                <v-alert v-if="profileSuccess" type="success" variant="tonal" density="compact" class="mb-4 max-width-field">
                  {{ profileSuccess }}
                </v-alert>

                <v-btn
                  type="submit"
                  color="primary"
                  class="font-weight-bold text-on-primary"
                  :loading="isUpdatingProfile"
                  :disabled="!editName.trim() || editName === user.name"
                  height="44"
                >
                  Atualizar Dados
                </v-btn>
              </v-form>
            </div>

            <v-divider class="my-6 border-color-soft" />

            <!-- Alteração de Senha -->
            <div class="mb-8">
              <h2 class="section-title text-h5 text-on-surface mb-2">Segurança</h2>
              <p class="section-subtitle text-caption text-secondary mb-6">Atualize sua senha de acesso.</p>

              <v-form @submit.prevent="handleUpdatePassword">
                <div class="mb-4 max-width-field">
                  <label class="d-block text-subtitle-2 text-on-surface mb-2 font-weight-bold">Senha Atual</label>
                  <v-text-field
                    v-model="currentPassword"
                    :rules="[rules.required]"
                    type="password"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    bg-color="#261c12"
                    base-color="#9b8a75"
                    color="#c9a227"
                  />
                </div>

                <v-row class="max-width-field-row">
                  <v-col cols="12" sm="6" class="py-1">
                    <label class="d-block text-subtitle-2 text-on-surface mb-2 font-weight-bold">Nova Senha</label>
                    <v-text-field
                      v-model="newPassword"
                      :rules="[rules.required, rules.minLength]"
                      type="password"
                      variant="outlined"
                      density="comfortable"
                      hide-details="auto"
                      bg-color="#261c12"
                      base-color="#9b8a75"
                      color="#c9a227"
                    />
                  </v-col>
                  <v-col cols="12" sm="6" class="py-1">
                    <label class="d-block text-subtitle-2 text-on-surface mb-2 font-weight-bold">Confirmar Nova Senha</label>
                    <v-text-field
                      v-model="confirmPassword"
                      :rules="[rules.required, rules.match]"
                      type="password"
                      variant="outlined"
                      density="comfortable"
                      hide-details="auto"
                      bg-color="#261c12"
                      base-color="#9b8a75"
                      color="#c9a227"
                    />
                  </v-col>
                </v-row>

                <v-alert v-if="passwordSuccess" type="success" variant="tonal" density="compact" class="mt-4 mb-4 max-width-field">
                  {{ passwordSuccess }}
                </v-alert>

                <v-btn
                  type="submit"
                  color="primary"
                  class="font-weight-bold text-on-primary mt-4"
                  :loading="isChangingPassword"
                  :disabled="!currentPassword || !newPassword || newPassword !== confirmPassword"
                  height="44"
                >
                  Alterar Senha
                </v-btn>
              </v-form>
            </div>

            <v-divider class="my-6 border-color-soft" />

            <!-- Exclusão de Conta (Zona de Perigo) -->
            <div class="danger-zone py-4 px-4 rounded-lg">
              <h2 class="section-title text-h5 text-error mb-2">Excluir Conta</h2>
              <p class="section-subtitle text-caption text-secondary mb-4">
                Atenção: Esta ação é irreversível. Todos os seus dados, favoritos e histórico de conversas serão removidos permanentemente.
              </p>
              <v-btn
                color="error"
                variant="outlined"
                class="font-weight-bold"
                height="44"
                @click="showDeleteDialog = true"
              >
                Excluir Minha Conta
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Dialog de confirmação de exclusão -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="glass-card" style="background-color: #1a130b; border: 1px solid rgba(232, 213, 183, 0.12);">
        <v-card-title class="text-h5 text-error font-weight-bold pt-6 px-6">
          Excluir Conta Permanentemente?
        </v-card-title>
        <v-card-text class="px-6">
          <p class="text-body-2 text-on-surface-variant mb-4">
            Para confirmar a exclusão definitiva de sua conta, por favor, insira sua senha atual abaixo.
          </p>
          <v-text-field
            v-model="deleteConfirmPassword"
            label="Senha Atual"
            type="password"
            variant="outlined"
            density="comfortable"
            bg-color="#261c12"
            base-color="#9b8a75"
            color="#c9a227"
            hide-details="auto"
          />
          <v-alert v-if="deleteError" type="error" variant="tonal" density="compact" class="mt-4">
            {{ deleteError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pb-6 px-6 justify-end">
          <v-btn
            variant="text"
            color="secondary"
            class="font-weight-bold"
            @click="showDeleteDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            class="font-weight-bold px-4"
            :loading="isDeletingAccount"
            :disabled="!deleteConfirmPassword"
            @click="handleDeleteAccount"
          >
            Excluir Conta
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.profile-page {
  position: relative;
  min-height: calc(100vh - 65px);
  background-color: #110c07;
  color: #e8d5b7;
  overflow: hidden;
}

.profile-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--fundo);
  background-size: cover;
  background-position: center;
  opacity: 0.08;
  pointer-events: none;
}

.profile-page__glow {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 900px;
  height: 900px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 162, 39, 0.12) 0%, rgba(201, 162, 39, 0.02) 50%, transparent 70%);
  pointer-events: none;
}

.profile-container {
  position: relative;
  z-index: 2;
  max-width: 1200px;
}

/* Glassmorphism Card Style */
.glass-card {
  background-color: rgba(26, 19, 11, 0.85) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(232, 213, 183, 0.12) !important;
  border-radius: 16px !important;
}

/* Profile Details Card */
.profile-card {
  overflow: hidden;
}

.profile-avatar {
  border: 3px solid #c9a227;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.4);
  background-color: #2a1f14;
}

.profile-name {
  font-family: 'Playfair Display', serif;
}

.profile-email {
  font-family: 'Roboto', sans-serif;
  letter-spacing: 0.5px;
}

.border-right-soft {
  border-right: 1px solid rgba(155, 138, 117, 0.2);
}

.border-color-soft {
  border-color: rgba(155, 138, 117, 0.2) !important;
}

.uppercase {
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Navigation List style */
.menu-card {
  padding: 8px;
}

.menu-item {
  font-family: 'Playfair Display', serif;
  border-radius: 8px !important;
  margin-bottom: 4px;
  color: #9b8a75 !important;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: rgba(201, 162, 39, 0.08) !important;
  color: #e8d5b7 !important;
}

.menu-item.v-list-item--active {
  background-color: rgba(201, 162, 39, 0.15) !important;
  color: #c9a227 !important;
  font-weight: bold;
}

/* Content Area Cards */
.content-card {
  min-height: 500px;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
}

.section-subtitle {
  font-family: 'Playfair Display', serif;
}

.input-section-title {
  font-family: 'Playfair Display', serif;
  border-bottom: 1px solid rgba(201, 162, 39, 0.2);
  padding-bottom: 6px;
}

/* Chips Style */
.genre-chip {
  font-family: 'Playfair Display', serif;
  border-color: rgba(232, 213, 183, 0.25) !important;
  color: #9b8a75 !important;
  background-color: transparent !important;
  cursor: pointer;
  transition: all 0.2s ease;
}

.genre-chip:hover {
  border-color: #c9a227 !important;
  color: #e8d5b7 !important;
  background-color: rgba(201, 162, 39, 0.05) !important;
}

.genre-chip.is-selected {
  border-color: #c9a227 !important;
  background-color: rgba(201, 162, 39, 0.18) !important;
  color: #c9a227 !important;
  font-weight: 600;
}

.author-chip {
  font-family: 'Playfair Display', serif;
  border: 1px solid rgba(232, 213, 183, 0.15) !important;
  background-color: rgba(42, 31, 20, 0.6) !important;
  color: #e8d5b7 !important;
}

.author-chip :deep(.v-chip__close) {
  color: #c9a227;
}

/* Input Fields and Buttons */
.max-width-field {
  max-width: 480px;
}

.max-width-field-row {
  max-width: 496px;
}

.add-btn {
  font-family: 'Playfair Display', serif;
  border-radius: 8px !important;
}

.danger-zone {
  border: 1px solid rgba(207, 102, 121, 0.25);
  background-color: rgba(207, 102, 121, 0.03);
}

.text-error {
  color: #cf6679 !important;
}

/* Grid de Favoritos */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 20px;
}

.book-card {
  background-color: rgba(26, 19, 11, 0.4);
  border: 1px solid rgba(232, 213, 183, 0.08);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.book-card:hover {
  transform: translateY(-4px);
  border-color: rgba(201, 162, 39, 0.4);
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.3);
}

.book-card__cover-wrapper {
  position: relative;
  padding-top: 145%; /* Aspect ratio de capa de livro */
  background-color: #2a1f14;
}

.book-card__cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.book-card__title {
  font-family: 'Playfair Display', serif;
  font-size: 14px !important;
  line-height: 1.2;
}

.book-card__author {
  font-size: 11px !important;
}

.cursor-pointer {
  cursor: pointer;
  transition: color 0.2s ease;
}

.cursor-pointer:hover {
  color: #c9a227 !important;
}

/* Utils styles */
.match-height {
  align-items: stretch;
}

.font-neuton {
  font-family: 'Neuton', serif;
}
</style>
