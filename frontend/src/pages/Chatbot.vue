<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { chatService, type ChatMessage } from '@/services'

const router = useRouter()
const route = useRoute()

// ── Estado ──────────────────────────────────────────────────────────────────
const question     = ref('')
const selectedGenre = ref('')
const genres       = ['Ficção', 'Terror', 'Romance', 'Aventura', 'Fantasia']
const messages     = ref<ChatMessage[]>([])
const isLoading    = ref(false)
const isClosingConversation = ref(false)
const errorMsg     = ref('')
const chatContent  = ref<HTMLElement | null>(null)
let hasClosedCurrentConversation = false

// ── Helpers ──────────────────────────────────────────────────────────────────
function scrollToBottom() {
  nextTick(() => {
    if (chatContent.value) {
      chatContent.value.scrollTop = chatContent.value.scrollHeight
    }
  })
}

async function closeActiveConversation() {
  if (isClosingConversation.value || hasClosedCurrentConversation || messages.value.length === 0) {
    return
  }

  isClosingConversation.value = true

  try {
    await chatService.closeConversation()
    hasClosedCurrentConversation = true
  } finally {
    isClosingConversation.value = false
  }
}

// ── Ciclo de vida ────────────────────────────────────────────────────────────
onMounted(async () => {
  const initialPrompt = typeof route.query.prompt === 'string' ? route.query.prompt.trim() : ''
  const initialGenre = typeof route.query.genre === 'string' ? route.query.genre.trim() : ''

  if (initialPrompt) {
    selectedGenre.value = genres.includes(initialGenre) ? initialGenre : ''

    await router.replace({ path: route.path })
    await startNewConversationWithPrompt(initialPrompt, selectedGenre.value)
    return
  }

  try {
    const { messages: history } = await chatService.getHistory()
    messages.value = history.map(msg => {
      if (msg.recommendations) {
        msg.recommendations = msg.recommendations.map(rec => ({
          ...rec,
          isRevealed: false
        }))
      }
      return msg
    })
    scrollToBottom()
  } catch {
    // Sem histórico ainda — tudo bem
  }
})

onBeforeRouteLeave(async () => {
  try {
    await closeActiveConversation()
  } catch {
    // Silencioso — não bloqueia a navegação.
  }
})

// ── Ações ────────────────────────────────────────────────────────────────────
const selectGenre = (genre: string) => {
  selectedGenre.value = genre
}

const removeFilter = () => {
  selectedGenre.value = ''
}

async function sendMessage(messageOverride = '', genreOverride = selectedGenre.value) {
  const text = (messageOverride || question.value).trim()
  if (!text || isLoading.value) return

  errorMsg.value = ''
  if (!messageOverride) {
    question.value = ''
  }

  // Adiciona prefixo de gênero se selecionado
  const fullMessage = genreOverride
    ? `[Gênero: ${genreOverride}] ${text}`
    : text

  // Adiciona mensagem do usuário na tela imediatamente
  messages.value.push({
    role: 'user',
    content: text,
    timestamp: new Date().toISOString(),
  })
  scrollToBottom()

  isLoading.value = true

  try {
    const response = await chatService.sendMessage(fullMessage)
    hasClosedCurrentConversation = false

    const mappedRecs = response.recommendations
      ? response.recommendations.map(rec => ({ ...rec, isRevealed: false }))
      : []

    messages.value.push({
      role: 'assistant',
      content: response.reply,
      recommendations: mappedRecs,
      timestamp: new Date().toISOString(),
    })
    scrollToBottom()
  } catch (err: unknown) {
    errorMsg.value =
      err instanceof Error ? err.message : 'Erro ao enviar mensagem. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}

async function startNewConversationWithPrompt(prompt: string, genre = '') {
  if (isLoading.value || isClosingConversation.value) return

  isClosingConversation.value = true
  errorMsg.value = ''

  try {
    await chatService.closeConversation()
    await chatService.clearHistory()
    messages.value = []
    hasClosedCurrentConversation = false
  } catch {
    messages.value = []
  } finally {
    isClosingConversation.value = false
  }

  await sendMessage(prompt, genre)
}

async function newConversation() {
  if (isClosingConversation.value) return

  isClosingConversation.value = true
  errorMsg.value = ''

  try {
    await closeActiveConversation()
    await chatService.clearHistory()
    messages.value = []
    hasClosedCurrentConversation = false
  } catch (error) {
    errorMsg.value = error instanceof Error
      ? error.message
      : 'Erro ao salvar e limpar conversa.'
  } finally {
    isClosingConversation.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="chatbot-page">
    <Navbar />

    <main class="chat-container">
      <!-- Área de mensagens -->
      <div ref="chatContent" class="chat-content">

        <!-- Mensagem de boas-vindas quando não há histórico -->
        <div v-if="messages.length === 0 && !isLoading" class="chat-welcome">
          <div class="welcome-icon">
            <v-icon size="48" color="#C9A227">mdi-robot-outline</v-icon>
          </div>
          <h2 class="welcome-title">Olá! Sou o seu assistente literário.</h2>
          <p class="welcome-subtitle">
            Me conte sobre seus gostos e vou recomendar os livros perfeitos para você.
          </p>
        </div>

        <!-- Histórico de mensagens -->
        <div v-for="(msg, index) in messages" :key="index">

          <!-- Mensagem do usuário -->
          <div v-if="msg.role === 'user'" class="chat-message user-message">
            <div class="user-bubble">{{ msg.content }}</div>
          </div>

          <!-- Resposta da IA -->
          <div v-else class="chat-message ai-message">
            <div class="ai-avatar">
              <v-icon size="32" color="#110C07">mdi-robot-outline</v-icon>
            </div>

            <div class="ai-body">
              <p class="ai-text">{{ msg.content }}</p>

              <!-- Recomendações de livros -->
              <div v-if="msg.recommendations && msg.recommendations.length > 0" class="book-recommendations">
                <div
                  v-for="(book, bookIndex) in msg.recommendations"
                  :key="bookIndex"
                  class="book-item"
                  :class="{ 'book-item--blurred': book.sensitiveContent && !book.isRevealed }"
                >
                  <template v-if="book.sensitiveContent && !book.isRevealed">
                    <div class="sensitive-overlay">
                      <v-icon icon="mdi-alert-decagram" color="#c9a227" size="24" class="mb-1" />
                      <span class="sensitive-title">Conteúdo Sensível</span>
                      <p class="sensitive-text">Esta sugestão contém temas sensíveis.</p>
                      <button class="sensitive-btn" type="button" @click="book.isRevealed = true">
                        Revelar
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <!-- Capa do livro (quando disponível via Google Books) -->
                    <div v-if="book.coverUrl" class="book-cover-wrapper">
                      <img :src="book.coverUrl" :alt="book.title" class="book-cover" />
                    </div>

                    <div class="book-info">
                      <span class="book-title">{{ book.title }}</span>
                      <span v-if="book.author" class="book-author">{{ book.author }}</span>
                      <p v-if="book.synopsis" class="book-synopsis">{{ book.synopsis }}</p>
                      <span v-if="book.publishedDate" class="book-date">{{ book.publishedDate }}</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicador de carregamento -->
        <div v-if="isLoading" class="chat-message ai-message">
          <div class="ai-avatar">
            <v-icon size="32" color="#110C07">mdi-robot-outline</v-icon>
          </div>
          <div class="ai-body">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <!-- Mensagem de erro -->
        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          density="compact"
          class="chat-error"
          closable
          @click:close="errorMsg = ''"
        >
          {{ errorMsg }}
        </v-alert>
      </div>

      <!-- Barra inferior -->
      <div class="chat-input-wrapper">

        <!-- Botão nova conversa -->
        <button
          v-if="messages.length > 0"
          class="new-chat-btn"
          :disabled="isClosingConversation"
          @click="newConversation"
          title="Iniciar nova conversa"
        >
          <v-progress-circular
            v-if="isClosingConversation"
            indeterminate
            size="16"
            width="2"
            color="#C9A227"
          />
          <v-icon v-else size="18">mdi-refresh</v-icon>
          {{ isClosingConversation ? 'Salvando...' : 'Nova conversa' }}
        </button>

        <div class="chat-input-bar">
          <!-- Filtro de gênero ativo -->
          <div v-if="selectedGenre" class="filter-tag">
            <button class="remove-filter" @click="removeFilter">
              <v-icon size="14">mdi-close</v-icon>
            </button>
            {{ selectedGenre }}
          </div>

          <!-- Menu de filtros -->
          <v-menu v-else location="top start" transition="fade-transition">
            <template #activator="{ props }">
              <button class="add-filter-btn" v-bind="props">
                <v-icon size="18">mdi-filter-variant</v-icon>
                Filtros
              </button>
            </template>

            <v-list class="filter-menu">
              <v-list-item
                v-for="genre in genres"
                :key="genre"
                @click="selectGenre(genre)"
                class="filter-menu-item"
              >
                <v-list-item-title>{{ genre }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- Campo de texto -->
          <input
            v-model="question"
            type="text"
            placeholder="Faça uma pergunta sobre o seu livro ideal..."
            class="chat-input"
            :disabled="isLoading"
            @keydown="handleKeydown"
          />

          <!-- Botão enviar -->
          <button
            class="send-btn"
            :class="{ 'send-btn--loading': isLoading }"
            :disabled="isLoading || !question.trim()"
            @click="sendMessage()"
          >
            <v-icon v-if="!isLoading">mdi-send</v-icon>
            <v-progress-circular v-else indeterminate size="20" width="2" color="#C9A227" />
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.chatbot-page {
  min-height: 100vh;
  background-color: #110C07;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* ── Área de mensagens ─────────────────────────────────── */
.chat-content {
  flex: 1;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 20px 160px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* ── Boas-vindas ───────────────────────────────────────── */
.chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  gap: 16px;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(201, 162, 39, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.welcome-title {
  font-family: "Playfair Display", serif;
  font-size: 28px;
  font-weight: 700;
  color: #E8D5B7;
  margin: 0;
}

.welcome-subtitle {
  font-family: "Roboto", sans-serif;
  font-size: 16px;
  color: #7A6B5D;
  max-width: 480px;
  line-height: 1.6;
  margin: 0;
}

/* ── Mensagens ─────────────────────────────────────────── */
.chat-message {
  margin-bottom: 32px;
}

.user-message {
  display: flex;
  justify-content: flex-end;
}

.user-bubble {
  background-color: #2A1F14;
  border: 1px solid rgba(201, 162, 39, 0.3);
  border-radius: 18px 18px 4px 18px;
  padding: 14px 20px;
  max-width: 70%;
  font-family: "Roboto", sans-serif;
  font-size: 16px;
  color: #E8D5B7;
  line-height: 1.5;
}

.ai-message {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.ai-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #C9A227;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-body {
  flex: 1;
}

.ai-text {
  font-family: "Playfair Display", serif;
  font-size: 18px;
  color: #E8D5B7;
  line-height: 1.6;
  margin-bottom: 24px;
}

/* ── Loading dots ──────────────────────────────────────── */
.loading-dots {
  display: flex;
  gap: 6px;
  padding: 8px 0;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #C9A227;
  animation: dot-bounce 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) { animation-delay: 0s; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── Recomendações de livros ───────────────────────────── */
.book-recommendations {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.book-item {
  display: flex;
  gap: 16px;
  background: rgba(42, 31, 20, 0.6);
  border: 1px solid rgba(232, 213, 183, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: border-color 0.2s;
}

.book-item:hover {
  border-color: rgba(201, 162, 39, 0.3);
}

.book-item--blurred {
  position: relative;
  min-height: 120px;
  background: rgba(42, 31, 20, 0.45) !important;
  border: 1px dashed rgba(201, 162, 39, 0.25) !important;
}

.book-item--blurred:hover {
  border-color: rgba(201, 162, 39, 0.4) !important;
}

.sensitive-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  text-align: center;
}

.sensitive-title {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 15px;
  color: #e8d5b7;
}

.sensitive-text {
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: #9b8a75;
  margin: 4px 0 10px;
}

.sensitive-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  background: #c9a227;
  color: #110c07;
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  transition: background 0.15s ease, transform 0.15s ease;
}

.sensitive-btn:hover {
  background: #e3be46;
  transform: translateY(-1px);
}

.sensitive-btn:active {
  transform: translateY(1px);
}

.book-cover-wrapper {
  flex-shrink: 0;
}

.book-cover {
  width: 70px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.book-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.book-title {
  font-family: "Playfair Display", serif;
  font-weight: 700;
  font-size: 17px;
  color: #E8D5B7;
}

.book-author {
  font-family: "Roboto", sans-serif;
  font-size: 14px;
  color: #C9A227;
  font-style: italic;
}

.book-synopsis {
  font-family: "Roboto", sans-serif;
  font-size: 14px;
  color: #9B8A75;
  line-height: 1.5;
  margin: 4px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-date {
  font-family: "Roboto", sans-serif;
  font-size: 12px;
  color: #5A4D42;
}

/* ── Erro ──────────────────────────────────────────────── */
.chat-error {
  margin-top: 16px;
}

/* ── Barra de input ────────────────────────────────────── */
.chat-input-wrapper {
  position: fixed;
  bottom: 40px;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
  gap: 10px;
  z-index: 100;
}

.new-chat-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(42, 31, 20, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(232, 213, 183, 0.2);
  border-radius: 20px;
  padding: 6px 16px;
  font-family: "Playfair Display", serif;
  font-size: 13px;
  color: #9B8A75;
  cursor: pointer;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  border-color: rgba(201, 162, 39, 0.4);
  color: #C9A227;
}

.new-chat-btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 804px;
  height: 66px;
  background-color: #2A1F14;
  border: 2px solid rgba(232, 213, 183, 0.25);
  border-radius: 33px;
  padding: 0 24px;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.3);
  transition: border-color 0.2s;
}

.chat-input-bar:focus-within {
  border-color: rgba(201, 162, 39, 0.5);
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 4px 12px;
  font-family: "Playfair Display", serif;
  font-size: 14px;
  color: #E8D5B7;
  flex-shrink: 0;
}

.remove-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #E8D5B7;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
}

.remove-filter:hover { opacity: 1; }

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: "Playfair Display", serif;
  font-size: 18px;
  color: #E8D5B7;
  min-width: 0;
}

.chat-input::placeholder { color: #7A6B5D; }
.chat-input:disabled { opacity: 0.5; cursor: not-allowed; }

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #C9A227;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s, opacity 0.2s;
}

.send-btn:hover:not(:disabled) { transform: scale(1.1); }
.send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.add-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid rgba(232, 213, 183, 0.4);
  border-radius: 20px;
  padding: 4px 12px;
  font-family: "Playfair Display", serif;
  font-size: 14px;
  color: #E8D5B7;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.add-filter-btn:hover {
  background: rgba(232, 213, 183, 0.1);
  border-color: #E8D5B7;
}

.filter-menu {
  background-color: #2A1F14 !important;
  border: 1px solid rgba(155, 138, 117, 0.25);
  border-radius: 8px;
  margin-bottom: 8px;
}

.filter-menu-item {
  font-family: "Playfair Display", serif;
  color: #E8D5B7 !important;
  cursor: pointer;
}

.filter-menu-item:hover {
  background-color: rgba(201, 162, 39, 0.1) !important;
  color: #C9A227 !important;
}
</style>
