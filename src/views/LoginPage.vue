<template>
  <div>
    <v-card-text>
      <v-form @submit.prevent="handleSubmit">
        <v-text-field
          v-model="username"
          label="Login"
          name="login"
          prepend-icon="mdi-account"
          type="text"
        />
        <v-text-field
          v-model="password"
          label="Password"
          name="password"
          prepend-icon="mdi-lock"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
        />
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            type="submit"
            :disabled="authStore.status.loggingIn"
            :loading="authStore.status.loggingIn"
          >
            Login
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>
    <v-snackbar v-model="errorSnackbar" :timeout="4000" color="error">
      {{ errorMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')

onMounted(() => {
  authStore.logout()
})

async function handleSubmit() {
  if (username.value && password.value) {
    try {
      await authStore.login(username.value, password.value)
    } catch {
      errorMessage.value = 'Login failed. Please check your credentials and try again.'
      errorSnackbar.value = true
    }
  }
}
</script>
