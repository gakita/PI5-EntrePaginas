<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CatalogGlow from '@/components/BackgroundGlow.vue'
import fundoImg from '@/assets/Fundo_Catalogo.jpg'
import {
  bookService,
  quizService,
  type CatalogItem,
  type QuizFinishResponse,
  type QuizQuestion,
} from '@/services'

const router = useRouter()
const backgroundImage = `url(${fundoImg})`

const GENERIC_QUESTION_COUNT = 3
const MORE_BOOKS_TARGET = 8

// Mapeia gêneros em português para "subjects" do Google Books (chaves sem acento).
const GENRE_SUBJECT_MAP: Record<string, string> = {
  'ficcao cientifica': 'science fiction',
  fantasia: 'fantasy',
  ficcao: 'fiction',
  romance: 'romance',
  terror: 'horror',
  horror: 'horror',
  misterio: 'mystery',
  aventura: 'adventure',
  drama: 'drama',
  suspense: 'thriller',
  thriller: 'thriller',
  biografia: 'biography',
  historia: 'history',
  poesia: 'poetry',
  infantil: 'juvenile fiction',
  juvenil: 'young adult fiction',
  quadrinhos: 'comics',
  hq: 'comics',
  manga: 'comics',
}

const sessionId = ref<string | null>(null)
const currentQuestion = ref<QuizQuestion | null>(null)
const answeredCount = ref(0)
const maxQuestions = ref(8)
const canFinish = ref(false)
const isComplete = ref(false)

const selectedAnswer = ref<string | null>(null)
const loading = ref(false)
const submitting = ref(false)
const finishing = ref(false)
const regenerating = ref(false)
const errorMsg = ref('')

const finishResult = ref<QuizFinishResponse | null>(null)

// "Mais livros para explorar" — revelado inline ao clicar em "Ver mais recomendações".
const moreBooks = ref<CatalogItem[]>([])
const showMore = ref(false)
const loadingMore = ref(false)
const moreError = ref('')

const questionNumber = computed(() => answeredCount.value + 1)

const isAiQuestion = computed(
  () => questionNumber.value > GENERIC_QUESTION_COUNT,
)

const titleLabel = computed(() => {
  if (!currentQuestion.value) return ''
  return isAiQuestion.value ? 'Pergunta gerada por IA' : 'Pergunta'
})

function goBack() {
  router.back()
}

function selectAlternative(option: string) {
  selectedAnswer.value = option
}

async function startQuiz() {
  loading.value = true
  errorMsg.value = ''
  finishResult.value = null
  showMore.value = false
  moreBooks.value = []
  moreError.value = ''

  try {
    const result = await quizService.start()
    sessionId.value = result.sessionId
    maxQuestions.value = result.maxQuestions
    currentQuestion.value = result.questions[0] ?? null
    answeredCount.value = 0
    canFinish.value = result.canFinish
    isComplete.value = false
    selectedAnswer.value = null
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : 'Erro ao iniciar o quiz.'
  } finally {
    loading.value = false
  }
}

async function submitAnswer() {
  if (
    !sessionId.value
    || !currentQuestion.value
    || !selectedAnswer.value
    || submitting.value
  ) {
    return
  }

  submitting.value = true
  errorMsg.value = ''

  try {
    const result = await quizService.answer(
      sessionId.value,
      currentQuestion.value.id,
      selectedAnswer.value,
    )

    answeredCount.value = result.answeredCount
    canFinish.value = result.canFinish
    isComplete.value = result.isComplete
    currentQuestion.value = result.question
    selectedAnswer.value = null

    if (result.isComplete) {
      await finishQuiz()
    }
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : 'Erro ao registrar resposta.'
  } finally {
    submitting.value = false
  }
}

async function regenerateQuestion() {
  if (!sessionId.value || regenerating.value || submitting.value) return

  regenerating.value = true
  errorMsg.value = ''

  try {
    const result = await quizService.regenerate(sessionId.value)
    currentQuestion.value = result.question
    selectedAnswer.value = null
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : 'Erro ao gerar outra pergunta.'
  } finally {
    regenerating.value = false
  }
}

async function finishQuiz() {
  if (!sessionId.value || finishing.value) return

  finishing.value = true
  errorMsg.value = ''

  try {
    finishResult.value = await quizService.finish(sessionId.value, true)
    currentQuestion.value = null
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : 'Erro ao finalizar o quiz.'
  } finally {
    finishing.value = false
  }
}

function restart() {
  startQuiz()
}

function goHome() {
  router.push('/')
}

function normalizeGenre(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Converte um gênero em PT para um subject do Google Books ('' quando não reconhece).
function mapGenreToSubject(genre: string): string {
  const key = normalizeGenre(genre)
  if (GENRE_SUBJECT_MAP[key]) return GENRE_SUBJECT_MAP[key]
  for (const mapKey of Object.keys(GENRE_SUBJECT_MAP)) {
    if (key.includes(mapKey)) return GENRE_SUBJECT_MAP[mapKey]
  }
  return ''
}

function firstType(types: string[]): string {
  const normalized = types.map((t) => t.trim().toLowerCase())
  if (normalized.includes('manga') || normalized.includes('mangá')) return 'manga'
  if (normalized.includes('hq')) return 'hq'
  if (normalized.includes('livro')) return 'livro'
  return ''
}

async function showMoreBooks() {
  showMore.value = true

  if (moreBooks.value.length || loadingMore.value) return

  const prefs = finishResult.value?.preferences
  if (!prefs) return

  loadingMore.value = true
  moreError.value = ''

  try {
    const type = firstType(prefs.types)

    // Títulos já mostrados nas recomendações do quiz (evita duplicar).
    const quizTitles = new Set(
      (finishResult.value?.recommendations ?? []).map(
        (rec) => (rec.title ?? '').toLowerCase(),
      ),
    )

    const collected: CatalogItem[] = []
    const seen = new Set<string>()

    const addItems = (items: CatalogItem[]) => {
      for (const item of items) {
        const key = (item.title ?? '').toLowerCase()
        if (item.coverUrl && item.title && !quizTitles.has(key) && !seen.has(key)) {
          seen.add(key)
          collected.push(item)
        }
      }
    }

    // 1) Tenta cada gênero reconhecido até juntar o suficiente.
    const subjects = [...new Set(prefs.genres.map(mapGenreToSubject).filter(Boolean))]
    for (const category of subjects) {
      if (collected.length >= MORE_BOOKS_TARGET) break
      const response = await bookService.list({ category, type, limit: 12 })
      addItems(response.items)
    }

    // 2) Fallback: nada encontrado — busca por tipo e, por fim, geral.
    if (collected.length === 0) {
      const response = await bookService.list({ type, limit: 12 })
      addItems(response.items)
    }
    if (collected.length === 0) {
      const response = await bookService.list({ limit: 12 })
      addItems(response.items)
    }

    moreBooks.value = collected
  } catch (err) {
    moreError.value =
      err instanceof Error ? err.message : 'Erro ao buscar mais livros.'
  } finally {
    loadingMore.value = false
  }
}

onMounted(() => {
  startQuiz()
})
</script>

<template>
  <main class="quiz-page">
    <div class="quiz-page__bg" />

    <div class="back-button" @click="goBack" role="button" aria-label="Voltar">
      <svg
        width="32"
        height="22"
        viewBox="0 0 50 33.33"
        fill="none"
        stroke="#C9A227"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="44" y1="16.67" x2="10" y2="16.67" />
        <polyline points="24,5 10,16.67 24,28.33" />
      </svg>
    </div>

    <CatalogGlow
      class="books-area__light"
      top="-200px"
      width="520px"
      height="520px"
      :opacity="0.7"
    />

    <div class="quiz-page__content">
      <!-- Carregando o quiz -->
      <div v-if="loading" class="quiz-status">Carregando quiz...</div>

      <!-- Tela de erro com retry -->
      <div v-else-if="errorMsg && !currentQuestion && !finishResult" class="quiz-status">
        <p class="quiz-error">{{ errorMsg }}</p>
        <button class="continue-button" type="button" @click="startQuiz">
          Tentar novamente
        </button>
      </div>

      <!-- Tela de resultado final -->
      <section v-else-if="finishResult" class="quiz-result">
        <p class="quiz-step">Quiz concluido</p>
        <h1 class="quiz-page__title">Suas recomendacoes</h1>
        <p class="quiz-message">{{ finishResult.message }}</p>

        <ul class="recommendations">
          <li
            v-for="(rec, index) in finishResult.recommendations"
            :key="`${rec.title}-${index}`"
            class="recommendation"
          >
            <img
              v-if="rec.coverUrl"
              :src="rec.coverUrl"
              :alt="`Capa de ${rec.title}`"
              class="recommendation__cover"
            />
            <div v-else class="recommendation__cover recommendation__cover--empty">
              <span>Sem capa</span>
            </div>
            <div class="recommendation__body">
              <h2 class="recommendation__title">{{ rec.title }}</h2>
              <p v-if="rec.author" class="recommendation__author">
                {{ rec.author }}
              </p>
              <p v-if="rec.justification" class="recommendation__text">
                {{ rec.justification }}
              </p>
              <p v-else-if="rec.synopsis" class="recommendation__text">
                {{ rec.synopsis }}
              </p>
              <span v-if="rec.sensitiveContent" class="recommendation__tag">
                Contém temas sensíveis
              </span>
            </div>
          </li>
        </ul>

        <!-- Mais livros para explorar (revelado inline) -->
        <section v-if="showMore" class="more-books">
          <h2 class="more-books__title">Mais livros para explorar</h2>

          <p v-if="loadingMore" class="quiz-message">Buscando mais livros...</p>
          <p v-else-if="moreError" class="quiz-error">{{ moreError }}</p>
          <p v-else-if="!moreBooks.length" class="quiz-message">
            Não encontramos outros livros agora. Tente novamente mais tarde.
          </p>

          <ul v-else class="recommendations">
            <li
              v-for="(book, index) in moreBooks"
              :key="`more-${book.googleBooksId ?? book.title}-${index}`"
              class="recommendation"
            >
              <img
                :src="book.coverUrl!"
                :alt="`Capa de ${book.title}`"
                class="recommendation__cover"
              />
              <div class="recommendation__body">
                <h2 class="recommendation__title">{{ book.title }}</h2>
                <p v-if="book.author" class="recommendation__author">
                  {{ book.author }}
                </p>
                <p v-if="book.synopsis" class="recommendation__text">
                  {{ book.synopsis }}
                </p>
              </div>
            </li>
          </ul>
        </section>

        <div class="quiz-result__actions">
          <button
            v-if="!showMore"
            class="continue-button"
            type="button"
            @click="showMoreBooks"
          >
            Ver mais recomendações
          </button>
          <button class="secondary-button" type="button" @click="goHome">
            Voltar para o início
          </button>
          <button class="finish-link" type="button" @click="restart">
            Refazer quiz
          </button>
        </div>
      </section>

      <!-- Pergunta atual -->
      <template v-else-if="currentQuestion">
        <p class="quiz-step">
          Pergunta {{ questionNumber }} de {{ maxQuestions }}
        </p>
        <p class="quiz-label">{{ titleLabel }}</p>
        <h1 class="quiz-page__title">{{ currentQuestion.text }}</h1>

        <div class="alternatives">
          <button
            v-for="(option, index) in currentQuestion.options"
            :key="`${currentQuestion.id}-${index}`"
            class="alternative-button"
            :class="{
              'alternative-button--selected': selectedAnswer === option,
            }"
            type="button"
            :disabled="submitting || finishing"
            @click="selectAlternative(option)"
          >
            {{ option }}
          </button>
        </div>

        <p v-if="errorMsg" class="quiz-error">{{ errorMsg }}</p>

        <button
          class="continue-button"
          type="button"
          :disabled="!selectedAnswer || submitting || finishing || regenerating"
          @click="submitAnswer"
        >
          {{ submitting ? 'Enviando...' : 'Continuar' }}
        </button>

        <button
          v-if="isAiQuestion"
          class="generate-link"
          type="button"
          :disabled="regenerating || submitting || finishing"
          @click="regenerateQuestion"
        >
          {{ regenerating ? 'Gerando...' : 'Gerar outra pergunta' }}
        </button>

        <button
          v-if="canFinish && !isComplete"
          class="finish-link"
          type="button"
          :disabled="finishing"
          @click="finishQuiz"
        >
          {{ finishing ? 'Gerando recomendacoes...' : 'Finalizar quiz agora' }}
        </button>
      </template>
    </div>
  </main>
</template>

<style scoped>
.quiz-page {
  position: relative;
  height: 100vh;
  background-color: #110c07;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 90px 24px 32px;
  box-sizing: border-box;
}

.quiz-page__content {
  position: relative;
  z-index: 5;
  width: 100%;
  max-width: 1080px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quiz-page__bg {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(17, 12, 7, 0.2), rgba(17, 12, 7, 0.2)), v-bind(backgroundImage);
  background-size: cover;
  background-position: center;
  opacity: 0.18;
  pointer-events: none;
}

.back-button {
  position: absolute;
  top: 28px;
  left: 32px;
  z-index: 10;
  width: 32px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.back-button:hover {
  opacity: 0.75;
}

.back-button:active {
  opacity: 0.6;
}

.quiz-step {
  margin: 0 0 8px 0;
  font-family: "Playfair Display", serif;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #C9A227;
  text-align: center;
}

.quiz-label {
  margin: 0 0 8px 0;
  font-family: "Playfair Display", serif;
  font-weight: 500;
  font-size: 17px;
  color: rgba(232, 213, 183, 0.75);
  text-align: center;
}

.quiz-page__title {
  width: 100%;
  max-width: 880px;
  margin: 0 0 36px 0;
  font-family: "Playfair Display", serif;
  font-weight: 600;
  font-style: normal;
  font-size: clamp(28px, 4vh, 40px);
  line-height: 1.2;
  letter-spacing: 0;
  text-align: center;
  color: #e8d5b7;
  text-shadow: 0px 3px 2px rgba(0, 0, 0, 0.25);
}

.alternatives {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}

.alternative-button {
  width: 100%;
  min-height: 54px;
  padding: 10px 22px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 14px;
  background-color: rgba(26, 18, 11, 0.75);
  cursor: pointer;
  box-shadow: 0px 3px 2px rgba(0, 0, 0, 0.25);
  transition: opacity 0.2s ease;
  font-family: "Neuton", serif;
  font-weight: 400;
  font-style: normal;
  font-size: 19px;
  line-height: 1.3;
  letter-spacing: 0;
  text-align: left;
  color: #E8D5B7;
}

.alternative-button:hover:not(:disabled) {
  opacity: 0.9;
}

.alternative-button:active:not(:disabled) {
  opacity: 0.8;
}

.alternative-button--selected {
  background-color: #C9A227;
  border-color: #C9A227;
  color: #1A120B;
}

.alternative-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.continue-button {
  width: 100%;
  max-width: 1080px;
  height: 58px;
  padding: 0 24px;
  border: none;
  border-radius: 29px;
  background-color: #C9A227;
  cursor: pointer;
  transition: opacity 0.2s ease;
  font-family: "Playfair Display", serif;
  font-weight: 600;
  font-style: normal;
  font-size: 22px;
  line-height: 1;
  letter-spacing: 0;
  text-align: center;
  color: #1A120B;
}

.continue-button:hover:not(:disabled) {
  opacity: 0.9;
}

.continue-button:active:not(:disabled) {
  opacity: 0.8;
}

.continue-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.finish-link {
  margin-top: 14px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: "Playfair Display", serif;
  font-weight: 500;
  font-style: normal;
  font-size: 17px;
  line-height: 1;
  letter-spacing: 0;
  text-align: center;
  text-decoration: underline;
  color: #C9A227;
}

.finish-link:hover:not(:disabled) {
  opacity: 0.85;
}

.finish-link:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.generate-link {
  margin-top: 14px;
  background: none;
  border: none;
  cursor: pointer;
  color: #C9A227;
  font-family: "Playfair Display", serif;
  font-size: 17px;
  font-style: normal;
  font-weight: 500;
  line-height: 1;
  text-decoration: underline;
  text-align: center;
  letter-spacing: 0;
}

.generate-link:hover:not(:disabled) {
  opacity: 0.85;
}

.generate-link:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.quiz-status {
  font-family: "Playfair Display", serif;
  font-size: 18px;
  color: #E8D5B7;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.quiz-error {
  font-family: "Neuton", serif;
  font-size: 14px;
  color: #ff9a8b;
  text-align: center;
  margin: 0 0 8px 0;
}

.quiz-result {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quiz-result {
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}

.quiz-message {
  width: 100%;
  max-width: 720px;
  margin: 0 0 18px 0;
  font-family: "Neuton", serif;
  font-size: 15px;
  line-height: 1.4;
  color: #E8D5B7;
  text-align: center;
}

.recommendations {
  list-style: none;
  padding: 0;
  margin: 0 0 18px 0;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.recommendation {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(232, 213, 183, 0.25);
  border-radius: 10px;
  background-color: rgba(26, 18, 11, 0.75);
}

.recommendation__cover {
  width: 56px;
  height: 84px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.recommendation__cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(232, 213, 183, 0.08);
  border: 1px dashed rgba(232, 213, 183, 0.3);
}

.recommendation__cover--empty span {
  font-family: "Neuton", serif;
  font-size: 10px;
  color: rgba(232, 213, 183, 0.6);
  text-align: center;
}

.quiz-result__actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.more-books {
  width: 100%;
  margin-bottom: 18px;
}

.more-books__title {
  margin: 8px 0 16px 0;
  font-family: "Playfair Display", serif;
  font-weight: 600;
  font-size: 22px;
  color: #C9A227;
  text-align: left;
}

.secondary-button {
  width: 100%;
  max-width: 1080px;
  height: 58px;
  padding: 0 24px;
  border: 1px solid #C9A227;
  border-radius: 29px;
  background-color: transparent;
  cursor: pointer;
  transition: opacity 0.2s ease;
  font-family: "Playfair Display", serif;
  font-weight: 600;
  font-size: 22px;
  line-height: 1;
  text-align: center;
  color: #C9A227;
}

.secondary-button:hover {
  opacity: 0.85;
}

.secondary-button:active {
  opacity: 0.7;
}

.recommendation__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: #E8D5B7;
}

.recommendation__title {
  margin: 0;
  font-family: "Playfair Display", serif;
  font-size: 15px;
  font-weight: 600;
}

.recommendation__author {
  margin: 0;
  font-family: "Neuton", serif;
  font-size: 13px;
  opacity: 0.75;
}

.recommendation__text {
  margin: 0;
  font-family: "Neuton", serif;
  font-size: 12px;
  line-height: 1.35;
}

.recommendation__tag {
  display: inline-block;
  margin-top: 2px;
  padding: 2px 8px;
  border-radius: 999px;
  background-color: rgba(201, 162, 39, 0.18);
  border: 1px solid #C9A227;
  color: #C9A227;
  font-family: "Neuton", serif;
  font-size: 11px;
  width: fit-content;
}
</style>
