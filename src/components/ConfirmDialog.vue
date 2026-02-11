<template>
  <v-dialog v-model="isOpen" max-width="400" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" :color="'warning'">{{ icon }}</v-icon>
        {{ title }}
      </v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">Cancel</v-btn>
        <v-btn color="warning" variant="text" @click="handleConfirm">{{ confirmText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useConfirmDialog } from '@/composables/useConfirmDialog'

const { isOpen, title, message, confirmText, icon, handleConfirm, handleCancel } =
  useConfirmDialog()
</script>
