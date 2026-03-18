<template>
  <v-card class="ma-4">
    <v-progress-linear v-if="loading" indeterminate />
    <v-card-title>Telegram Bot Settings</v-card-title>
    <v-card-text>
      <v-alert type="info" variant="tonal" density="compact" class="mb-4">
        The Telegram bot polls for messages automatically when the server starts.
        Send <strong>/id</strong> to the bot to find your Telegram user ID.
        Restart the server after changing the bot token.
      </v-alert>
      <v-form ref="formRef">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.telegram_bot_token"
              label="Bot Token"
              hint="From @BotFather on Telegram"
              persistent-hint
              :type="showToken ? 'text' : 'password'"
              :append-inner-icon="showToken ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showToken = !showToken"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.telegram_allowed_users"
              label="Allowed User IDs"
              hint="Comma-separated Telegram user IDs"
              persistent-hint
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" :loading="saving" @click="saveSettings">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSnackbarStore } from '@/stores/snackbar'
import api from '@/services/api'

const snackbarStore = useSnackbarStore()
const loading = ref(false)
const saving = ref(false)
const showToken = ref(false)

const settings = ref<Record<string, string>>({
  telegram_bot_token: '',
  telegram_allowed_users: '',
})

const settingKeys = ['telegram_bot_token', 'telegram_allowed_users']

async function loadSettings() {
  loading.value = true
  try {
    for (const key of settingKeys) {
      try {
        const { data } = await api.get(`/api/v1/settings/${key}`)
        settings.value[key] = data.app_setting?.value ?? ''
      } catch {
        settings.value[key] = ''
      }
    }
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    for (const key of settingKeys) {
      await api.put(`/api/v1/settings/${key}`, { value: settings.value[key] })
    }
    snackbarStore.showSnackbar({ text: 'Telegram settings saved', color: 'success' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(() => loadSettings())
</script>
