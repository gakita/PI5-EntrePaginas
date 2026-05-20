<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')



const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  email: (v: string) => /.+@.+\..+/.test(v) || 'E-mail inválido',
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Preencha todos os campos.'
    return
  }

  loading.value = true

  try {
    const { token } = await authService.login(email.value, password.value)
    auth.setToken(token)
    router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'E-mail ou senha inválidos.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Left panel -->
    <div class="login-page__left">
      <div class="login-page__glow" />

      <div class="login-page__left-content">
        <h1 class="login-page__title">Faça login</h1>
        <h2 class="login-page__subtitle">e continue sua jornada literária</h2>
        <p class="login-page__description">
          Acesse suas recomendações personalizadas e descubra sua próxima leitura favorita.
        </p>
      </div>
    </div>

    <!-- Right panel -->
    <div class="login-page__right">
      <div class="login-page__card">
        <h3 class="login-page__card-title">Bem-vindo de volta!</h3>

        <v-form @submit.prevent="handleSubmit">
          <div class="login-page__field-group">
            <label class="login-page__label">Email</label>
            <v-text-field
              v-model="email"
              :rules="[rules.required, rules.email]"
              type="email"
              placeholder="seu@email.com"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              bg-color="#1e1710"
              base-color="#9b8a75"
              color="#c9a227"
            />
          </div>

          <div class="login-page__field-group">
            <label class="login-page__label">Senha</label>
            <v-text-field
              v-model="password"
              :rules="[rules.required]"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              placeholder="••••••••"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              bg-color="#1e1710"
              base-color="#9b8a75"
              color="#c9a227"
              @click:append-inner="showPassword = !showPassword"
            />
          </div>

          <div class="login-page__forgot">
            <a href="#" class="login-page__link">Esqueceu sua senha?</a>
          </div>

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            density="compact"
            class="login-page__error"
          >
            {{ errorMessage }}
          </v-alert>

          <v-btn
            type="submit"
            :loading="loading"
            class="login-page__btn"
            block
            height="56"
          >
            Continuar
          </v-btn>
        </v-form>

        <p class="login-page__register">
          Não tem uma conta?
          <router-link to="/registrar" class="login-page__link">Criar Conta</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background-color: #110c07;
}

/* ─── Left panel ─────────────────────────────────────── */

.login-page__left {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 60px 48px;
}

.login-page__glow {
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

.login-page__left-content {
  position: relative;
  z-index: 1;
  max-width: 460px;
  text-align: center;
}

.login-page__title {
  font-family: "Playfair Display", serif;
  font-size: 80px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -2px;
  color: #e8d5b7;
  text-shadow: 0px 6px 3px rgba(0, 0, 0, 0.25);
  margin: 0;
}

.login-page__subtitle {
  font-family: "Playfair Display", serif;
  font-size: 28px;
  font-weight: 400;
  font-style: italic;
  color: #c9a227;
  margin: 8px 0 32px;
}

.login-page__description {
  font-family: "Playfair Display", serif;
  font-size: 18px;
  font-weight: 400;
  color: #9b8a75;
  line-height: 1.6;
  margin: 0;
}

/* ─── Right panel ────────────────────────────────────── */

.login-page__right {
  width: 560px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
}

.login-page__card {
  width: 100%;
  max-width: 460px;
  background-color: #1a130b;
  border: 1px solid rgba(232, 213, 183, 0.12);
  border-radius: 20px;
  padding: 48px 40px;
}

.login-page__card-title {
  font-family: "Playfair Display", serif;
  font-size: 36px;
  font-weight: 600;
  color: #e8d5b7;
  margin: 0 0 40px;
  text-align: center;
}

.login-page__field-group {
  margin-bottom: 24px;
}

.login-page__label {
  display: block;
  font-family: "Playfair Display", serif;
  font-size: 18px;
  font-weight: 600;
  color: #e8d5b7;
  margin-bottom: 8px;
}

.login-page__forgot {
  text-align: right;
  margin-top: -12px;
  margin-bottom: 28px;
}

.login-page__link {
  font-family: "Playfair Display", serif;
  font-size: 15px;
  color: #c9a227;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: opacity 0.2s ease;
}

.login-page__link:hover {
  opacity: 0.75;
}

.login-page__error {
  margin-bottom: 20px;
}

.login-page__btn {
  background-color: #c9a227 !important;
  color: #1a120b !important;
  font-family: "Playfair Display", serif !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  border-radius: 12px !important;
  box-shadow: 0px 6px 4px rgba(0, 0, 0, 0.25) !important;
  margin-bottom: 24px;
}

.login-page__register {
  font-family: "Playfair Display", serif;
  font-size: 15px;
  color: #9b8a75;
  text-align: center;
  margin: 0;
}

.login-page__register .login-page__link {
  margin-left: 4px;
}
</style>
