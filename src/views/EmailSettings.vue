<template>
  <v-card class="ma-4">
    <v-progress-linear v-if="loading" indeterminate />
    <v-card-title>Email Settings</v-card-title>
    <v-card-text>
      <v-form ref="formRef">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.mail_server"
              label="Mail Server"
              hint="e.g. smtp.gmail.com"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="settings.mail_port"
              label="Mail Port"
              hint="e.g. 465"
              persistent-hint
              type="number"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-switch
              v-model="useSSL"
              label="Use SSL"
              color="primary"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.mail_username"
              label="Username"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.mail_password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.mail_default_sender"
              label="Default Sender"
              hint="From address for outgoing emails"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.mail_order_recipient"
              label="Order Recipient"
              hint="Email address that receives order notifications"
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
import { ref, computed, onMounted } from 'vue'
import { settingsService } from '@/services/settings.service'
import { useSnackbarStore } from '@/stores/snackbar'

const snackbarStore = useSnackbarStore()
const loading = ref(false)
const saving = ref(false)
const showPassword = ref(false)

const settings = ref<Record<string, string>>({
  mail_server: '',
  mail_port: '465',
  mail_use_ssl: '1',
  mail_username: '',
  mail_password: '',
  mail_default_sender: '',
  mail_order_recipient: '',
})

const useSSL = computed({
  get: () => settings.value.mail_use_ssl !== '0',
  set: (val: boolean) => { settings.value.mail_use_ssl = val ? '1' : '0' },
})

async function loadSettings() {
  loading.value = true
  try {
    const data = await settingsService.getAll()
    for (const key of Object.keys(settings.value)) {
      if (data[key] !== undefined && data[key] !== null) {
        settings.value[key] = data[key] as string
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load settings'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    const promises = Object.entries(settings.value).map(([key, value]) =>
      settingsService.update(key, value)
    )
    await Promise.all(promises)
    snackbarStore.showSnackbar({ text: 'Settings saved', color: 'success' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>
