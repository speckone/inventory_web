<template>
  <v-container
    class="fill-height"
    fluid
  >
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex justify-center pt-4 pb-2">
            <img
              src="@/assets/esso-coffee-logo.png"
              alt="Esso Coffee"
              style="max-width: 160px; max-height: 100px;"
            />
          </div>
          <v-card-title class="text-center text-h5 font-weight-medium" style="color: #6D4C41;">
            Esso Inventory
          </v-card-title>
          <v-card-subtitle class="text-center pb-4">
            Sign in to your account
          </v-card-subtitle>
          <v-card-text>
            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="username"
                label="Username"
                name="login"
                prepend-inner-icon="mdi-account"
                type="text"
                class="mb-2"
              />
              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                class="mb-2"
                @click:append-inner="showPassword = !showPassword"
              />
              <v-btn
                color="primary"
                type="submit"
                block
                size="large"
                :disabled="authStore.status.loggingIn"
                :loading="authStore.status.loggingIn"
              >
                Sign In
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar v-model="errorSnackbar" :timeout="4000" color="error">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
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

<style scoped>
.fill-height {
  min-height: 100vh;
  background-color: #EFEBE9;
}
</style>
