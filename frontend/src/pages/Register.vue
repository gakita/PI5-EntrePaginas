<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services'
import fundoImg from '@/assets/FUNDO.png'

const router = useRouter()
const auth = useAuthStore()

const currentStep = ref(1)
const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const formData = ref({
  name: '',
  email: '',
  password: '',
  verificationCode: '',
  sensitiveThemes: [] as string[],
  genres: [] as string[],
  subGenres: [] as string[],
})

const otpDigits = ref(['', '', '', '', '', ''])

const steps = [
  { number: 1, label: 'Dados básicos' },
  { number: 2, label: 'Verificar e-mail' },
  { number: 3, label: 'Temas sensíveis' },
  { number: 4, label: 'Preferências' },
]

const sensitiveThemeOptions = [
  'Violência', 'Terror psicológico', 'Romance adulto',
  'Temas sombrios', 'Conteúdo perturbador', 'Morte e luto',
  'Abuso e trauma', 'Guerra e conflito',
]

const genreOptions = [
  {
    id: 'ficcao', label: 'Ficção',
    subGenres: ['Fantasia', 'Sci-Fi', 'Distopia', 'Terror', 'Mitologia', 'Steampunk'],
  },
  {
    id: 'romance', label: 'Romance',
    subGenres: ['Contemporâneo', 'Histórico', 'Paranormal', 'Dark romance'],
  },
  {
    id: 'acao', label: 'Ação',
    subGenres: ['Aventura', 'Suspense', 'Thriller', 'Espionagem'],
  },
  {
    id: 'manga', label: 'Mangá',
    subGenres: ['Shonen', 'Shojo', 'Seinen', 'Isekai', 'Slice of life'],
  },
]

const expandedGenre = ref<string | null>(null)

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  email: (v: string) => /.+@.+\..+/.test(v) || 'E-mail inválido',
  minLength: (v: string) => v.length >= 6 || 'Mínimo de 6 caracteres',
}

function clearError() {
  errorMessage.value = ''
}

async function handleStep1() {
  clearError()
  const { name, email, password } = formData.value
  if (!name || !email || !password) {
    errorMessage.value = 'Preencha todos os campos.'
    return
  }
  if (!/.+@.+\..+/.test(email)) {
    errorMessage.value = 'E-mail inválido.'
    return
  }
  if (password.length < 6) {
    errorMessage.value = 'A senha deve ter no mínimo 6 caracteres.'
    return
  }
  loading.value = true
  await new Promise(r => setTimeout(r, 600))
  loading.value = false
  currentStep.value = 2
}

async function handleStep2() {
  clearError()
  const code = otpDigits.value.join('')
  if (code.length < 6) {
    errorMessage.value = 'Digite o código de 6 dígitos.'
    return
  }
  formData.value.verificationCode = code
  loading.value = true
  await new Promise(r => setTimeout(r, 600))
  loading.value = false
  currentStep.value = 3
}

function handleStep3() {
  clearError()
  currentStep.value = 4
}

async function handleStep4() {
  clearError()
  loading.value = true
  // TODO: substituir pelo authService.register(formData.value) quando o backend estiver pronto
  await new Promise(r => setTimeout(r, 800))
  loading.value = false
  router.push('/login')
}

async function resendCode() {
  // TODO: authService.resendVerificationCode(formData.value.email)
}

function onOtpInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(-1)
  otpDigits.value[index] = value
  if (value && index < 5) {
    nextTick(() => {
      const next = document.querySelector<HTMLInputElement>(`.otp-input-${index + 1}`)
      next?.focus()
    })
  }
}

function onOtpKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    nextTick(() => {
      const prev = document.querySelector<HTMLInputElement>(`.otp-input-${index - 1}`)
      prev?.focus()
    })
  }
}

function toggleSensitiveTheme(theme: string) {
  const idx = formData.value.sensitiveThemes.indexOf(theme)
  if (idx >= 0) formData.value.sensitiveThemes.splice(idx, 1)
  else formData.value.sensitiveThemes.push(theme)
}

function toggleGenre(id: string) {
  const idx = formData.value.genres.indexOf(id)
  if (idx >= 0) {
    formData.value.genres.splice(idx, 1)
    if (expandedGenre.value === id) expandedGenre.value = null
  } else {
    formData.value.genres.push(id)
    expandedGenre.value = id
  }
}

function toggleSubGenre(sub: string) {
  const idx = formData.value.subGenres.indexOf(sub)
  if (idx >= 0) formData.value.subGenres.splice(idx, 1)
  else formData.value.subGenres.push(sub)
}

function toggleExpand(id: string) {
  expandedGenre.value = expandedGenre.value === id ? null : id
}
</script>

<template>
  <!-- Steps 1–3: split layout -->
  <div v-if="currentStep < 4" class="register-page">

    <div class="register-page__left">
      <div class="register-page__glow" />
      <div class="register-page__left-content">
        <h1 class="register-page__title">Crie sua conta</h1>
        <h2 class="register-page__subtitle">e comece a explorar</h2>
        <p class="register-page__description">
          Junte-se a milhares de leitores e descubra recomendações personalizadas para você.
        </p>
      </div>
    </div>

    <div class="register-page__right">
      <div class="register-page__card">

        <!-- Stepper -->
        <div class="reg-steps">
          <template v-for="(step, i) in steps" :key="step.number">
            <div class="reg-steps__item" :class="{ 'is-active': step.number === currentStep, 'is-done': step.number < currentStep }">
              <div class="reg-steps__circle">{{ step.number }}</div>
              <span class="reg-steps__label">{{ step.label }}</span>
            </div>
            <div v-if="i < steps.length - 1" class="reg-steps__line" />
          </template>
        </div>

        <!-- ── Step 1: Dados básicos ───────────────────── -->
        <template v-if="currentStep === 1">
          <h3 class="register-page__card-title">Dados básicos</h3>
          <v-form @submit.prevent="handleStep1">
            <div class="reg-field">
              <label class="reg-label">Nome</label>
              <v-text-field v-model="formData.name" :rules="[rules.required]" placeholder="Seu nome completo"
                variant="outlined" density="comfortable" hide-details="auto"
                bg-color="#1e1710" base-color="#9b8a75" color="#c9a227" />
            </div>
            <div class="reg-field">
              <label class="reg-label">Email</label>
              <v-text-field v-model="formData.email" :rules="[rules.required, rules.email]" type="email"
                placeholder="seu@email.com" variant="outlined" density="comfortable" hide-details="auto"
                bg-color="#1e1710" base-color="#9b8a75" color="#c9a227" />
            </div>
            <div class="reg-field">
              <label class="reg-label">Senha</label>
              <v-text-field v-model="formData.password" :rules="[rules.required, rules.minLength]"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                placeholder="••••••••" variant="outlined" density="comfortable" hide-details="auto"
                bg-color="#1e1710" base-color="#9b8a75" color="#c9a227"
                @click:append-inner="showPassword = !showPassword" />
            </div>
            <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="reg-error">
              {{ errorMessage }}
            </v-alert>
            <v-btn type="submit" :loading="loading" class="reg-btn" block height="56">Continuar</v-btn>
          </v-form>
          <p class="reg-footer">
            Já tem uma conta?
            <router-link to="/login" class="reg-link">Fazer login</router-link>
          </p>
        </template>

        <!-- ── Step 2: Verificação de e-mail ─────────── -->
        <template v-else-if="currentStep === 2">
          <h3 class="register-page__card-title">Verifique seu e-mail</h3>
          <p class="reg-description">
            Enviamos um código para <strong>{{ formData.email }}</strong>. Cheque sua caixa de entrada.
          </p>
          <div class="otp-group">
            <input
              v-for="(_, i) in otpDigits"
              :key="i"
              :value="otpDigits[i]"
              :class="`otp-input otp-input-${i}`"
              type="text"
              inputmode="numeric"
              maxlength="1"
              @input="onOtpInput(i, $event)"
              @keydown="onOtpKeydown(i, $event)"
            />
          </div>
          <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="reg-error">
            {{ errorMessage }}
          </v-alert>
          <button class="reg-resend" @click="resendCode">Re-enviar código</button>
          <v-btn :loading="loading" class="reg-btn" block height="56" @click="handleStep2">
            Verificar e-mail
          </v-btn>
        </template>

        <!-- ── Step 3: Temas sensíveis ────────────────── -->
        <template v-else-if="currentStep === 3">
          <h3 class="register-page__card-title">Temas sensíveis</h3>
          <p class="reg-description">
            Selecione os temas que você aceita encontrar nas recomendações.
          </p>
          <div class="reg-tags">
            <button
              v-for="theme in sensitiveThemeOptions"
              :key="theme"
              class="reg-tag"
              :class="{ 'is-selected': formData.sensitiveThemes.includes(theme) }"
              @click="toggleSensitiveTheme(theme)"
            >
              {{ theme }}
            </button>
          </div>
          <v-btn class="reg-btn" block height="56" style="margin-top: 32px" @click="handleStep3">
            Continuar
          </v-btn>
        </template>

      </div>
    </div>
  </div>

  <!-- Step 4: Full dark layout ─────────────────────── -->
  <div v-else class="register-dark" :style="{ '--fundo': `url(${fundoImg})` }">
    <div class="register-dark__overlay" />
    <div class="register-dark__light" />

    <!-- Preferences card -->
    <div class="register-dark__card">

      <!-- Stepper -->
      <div class="reg-steps" style="margin-bottom: 32px">
        <template v-for="(step, i) in steps" :key="step.number">
          <div class="reg-steps__item" :class="{ 'is-active': step.number === 4, 'is-done': step.number < 4 }">
            <div class="reg-steps__circle">{{ step.number }}</div>
            <span class="reg-steps__label">{{ step.label }}</span>
          </div>
          <div v-if="i < steps.length - 1" class="reg-steps__line" />
        </template>
      </div>

      <h3 class="register-dark__title">Preferências de gêneros</h3>
      <p class="register-dark__subtitle">Selecione seus temas favoritos</p>

      <div class="genre-list">
        <div v-for="genre in genreOptions" :key="genre.id" class="genre-item">
          <div class="genre-item__header">
            <button
              class="genre-item__circle"
              :class="{ 'is-selected': formData.genres.includes(genre.id) }"
              @click="toggleGenre(genre.id)"
            />
            <span class="genre-item__label" @click="toggleExpand(genre.id)">
              {{ genre.label }}
              <v-icon size="18" class="genre-item__arrow">
                {{ expandedGenre === genre.id ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
              </v-icon>
            </span>
          </div>
          <div v-if="expandedGenre === genre.id" class="genre-item__subgenres">
            <button
              v-for="sub in genre.subGenres"
              :key="sub"
              class="subgenre-tag"
              :class="{ 'is-selected': formData.subGenres.includes(sub) }"
              @click="toggleSubGenre(sub)"
            >
              {{ sub }}
            </button>
          </div>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="reg-error">
        {{ errorMessage }}
      </v-alert>

      <v-btn :loading="loading" class="register-dark__btn" block height="64" @click="handleStep4">
        Finalizar
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
/* ─── Split layout (steps 1–3) ───────────────────────── */

.register-page {
  display: flex;
  min-height: 100vh;
  background-color: #110c07;
}

.register-page__left {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 60px 48px;
}

.register-page__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 162, 39, 0.15) 0%, rgba(201, 162, 39, 0.04) 50%, transparent 70%);
  pointer-events: none;
}

.register-page__left-content {
  position: relative;
  z-index: 1;
  max-width: 460px;
  text-align: center;
}

.register-page__title {
  font-family: "Playfair Display", serif;
  font-size: 72px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -2px;
  color: #e8d5b7;
  text-shadow: 0px 6px 3px rgba(0, 0, 0, 0.25);
  margin: 0;
}

.register-page__subtitle {
  font-family: "Playfair Display", serif;
  font-size: 28px;
  font-weight: 400;
  font-style: italic;
  color: #c9a227;
  margin: 8px 0 32px;
}

.register-page__description {
  font-family: "Playfair Display", serif;
  font-size: 18px;
  font-weight: 400;
  color: #9b8a75;
  line-height: 1.6;
  margin: 0;
}

.register-page__right {
  width: 580px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
}

.register-page__card {
  width: 100%;
  max-width: 480px;
  background-color: #1a130b;
  border: 1px solid rgba(232, 213, 183, 0.12);
  border-radius: 20px;
  padding: 40px 40px 48px;
}

.register-page__card-title {
  font-family: "Playfair Display", serif;
  font-size: 30px;
  font-weight: 600;
  color: #e8d5b7;
  margin: 0 0 28px;
  text-align: center;
}

/* ─── Stepper ─────────────────────────────────────────── */

.reg-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
}

.reg-steps--dark {
  margin-bottom: 0;
}

.reg-steps__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.reg-steps__circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid rgba(155, 138, 117, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Playfair Display", serif;
  font-size: 13px;
  font-weight: 600;
  color: #9b8a75;
  transition: all 0.2s ease;
}

.reg-steps__item.is-active .reg-steps__circle,
.reg-steps__item.is-done .reg-steps__circle {
  border-color: #c9a227;
  background-color: #c9a227;
  color: #1a120b;
}

.reg-steps__label {
  font-family: "Playfair Display", serif;
  font-size: 10px;
  color: #9b8a75;
  text-align: center;
  max-width: 52px;
  line-height: 1.3;
}

.reg-steps__item.is-active .reg-steps__label,
.reg-steps__item.is-done .reg-steps__label {
  color: #c9a227;
}

.reg-steps__line {
  width: 32px;
  height: 2px;
  background-color: rgba(155, 138, 117, 0.2);
  margin: 0 2px 18px;
  flex-shrink: 0;
}

/* ─── Shared form elements ───────────────────────────── */

.reg-field {
  margin-bottom: 20px;
}

.reg-label {
  display: block;
  font-family: "Playfair Display", serif;
  font-size: 17px;
  font-weight: 600;
  color: #e8d5b7;
  margin-bottom: 8px;
}

.reg-error {
  margin-bottom: 16px;
}

.reg-btn {
  background-color: #c9a227 !important;
  color: #1a120b !important;
  font-family: "Playfair Display", serif !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  border-radius: 12px !important;
  box-shadow: 0px 6px 4px rgba(0, 0, 0, 0.25) !important;
  margin-bottom: 20px;
}

.reg-footer {
  font-family: "Playfair Display", serif;
  font-size: 14px;
  color: #9b8a75;
  text-align: center;
  margin: 0;
}

.reg-link {
  color: #c9a227;
  text-decoration: underline;
  text-underline-offset: 3px;
  margin-left: 4px;
  transition: opacity 0.2s;
}

.reg-link:hover {
  opacity: 0.75;
}

.reg-description {
  font-family: "Playfair Display", serif;
  font-size: 15px;
  color: #9b8a75;
  line-height: 1.6;
  margin: 0 0 24px;
  text-align: center;
}

.reg-description strong {
  color: #e8d5b7;
}

/* ─── OTP ─────────────────────────────────────────────── */

.otp-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.otp-input {
  width: 52px;
  height: 64px;
  background-color: #1e1710;
  border: 2px solid rgba(155, 138, 117, 0.3);
  border-radius: 10px;
  font-family: "Playfair Display", serif;
  font-size: 28px;
  font-weight: 600;
  color: #e8d5b7;
  text-align: center;
  outline: none;
  caret-color: #c9a227;
  transition: border-color 0.2s;
}

.otp-input:focus {
  border-color: #c9a227;
}

.reg-resend {
  display: block;
  background: none;
  border: none;
  font-family: "Playfair Display", serif;
  font-size: 14px;
  color: #c9a227;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  margin: 0 auto 24px;
  transition: opacity 0.2s;
}

.reg-resend:hover {
  opacity: 0.75;
}

/* ─── Sensitive theme tags ────────────────────────────── */

.reg-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.reg-tag {
  padding: 8px 16px;
  border-radius: 25px;
  border: 1.5px solid rgba(155, 138, 117, 0.35);
  background-color: transparent;
  font-family: "Playfair Display", serif;
  font-size: 14px;
  color: #9b8a75;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reg-tag:hover {
  border-color: rgba(201, 162, 39, 0.5);
  color: #c9a227;
}

.reg-tag.is-selected {
  border-color: #c9a227;
  background-color: rgba(201, 162, 39, 0.12);
  color: #c9a227;
}

/* ─── Full dark layout (step 4) ──────────────────────── */

.register-dark {
  position: relative;
  min-height: 100vh;
  background-color: #110c07;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 60px;
  overflow: hidden;
}

.register-dark::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--fundo);
  background-size: cover;
  background-position: center;
  opacity: 0.15;
  pointer-events: none;
}

.register-dark__overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(17, 12, 7, 0.5);
  pointer-events: none;
  z-index: 0;
}

.register-dark__light {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 900px;
  height: 900px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 162, 39, 0.14) 0%, rgba(201, 162, 39, 0.03) 50%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}


.register-dark__card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 860px;
  background-color: rgba(26, 18, 11, 0.75);
  border: 1px solid rgba(232, 213, 183, 0.2);
  border-radius: 15px;
  padding: 40px 48px 48px;
}

.register-dark__title {
  font-family: "Playfair Display", serif;
  font-size: 40px;
  font-weight: 600;
  color: #e8d5b7;
  text-align: center;
  margin: 0 0 8px;
}

.register-dark__subtitle {
  font-family: "Playfair Display", serif;
  font-size: 22px;
  font-weight: 400;
  color: #9b8a75;
  text-align: center;
  margin: 0 0 32px;
}

/* ─── Genre list ──────────────────────────────────────── */

.genre-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 32px;
}

.genre-item__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
}

.genre-item__circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(155, 138, 117, 0.4);
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.genre-item__circle.is-selected {
  background-color: #c9a227;
  border-color: #c9a227;
}

.genre-item__label {
  font-family: "Playfair Display", serif;
  font-size: 26px;
  font-weight: 400;
  color: #e8d5b7;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.genre-item__arrow {
  color: #9b8a75;
  transition: transform 0.2s;
}

.genre-item__subgenres {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0 12px 48px;
}

.subgenre-tag {
  padding: 6px 16px;
  border-radius: 25px;
  border: 1.5px solid rgba(155, 138, 117, 0.35);
  background-color: transparent;
  font-family: "Playfair Display", serif;
  font-size: 14px;
  color: #9b8a75;
  cursor: pointer;
  transition: all 0.2s ease;
}

.subgenre-tag:hover {
  border-color: rgba(201, 162, 39, 0.5);
  color: #c9a227;
}

.subgenre-tag.is-selected {
  border-color: #c9a227;
  background-color: rgba(201, 162, 39, 0.12);
  color: #c9a227;
}

.register-dark__btn {
  background-color: #c9a227 !important;
  color: #120d07 !important;
  font-family: "Playfair Display", serif !important;
  font-size: 22px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  border-radius: 15px !important;
  box-shadow: 0px 6px 4px rgba(0, 0, 0, 0.25) !important;
}
</style>
