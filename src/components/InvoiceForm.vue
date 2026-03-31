<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)" @click:outside="$emit('close')">
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ formTitle }}</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model.number="localItem.invoice_number"
                label="Invoice Number"
                type="number"
                :rules="[v => !!v || 'Invoice number is required']"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <EntitySelect
                v-model="localItem.customer_id"
                label="Customer"
                :load-items="customerService.getAll"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="localItem.date"
                label="Date"
                type="date"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-checkbox
                v-model="localItem.paid"
                label="Paid"
                hide-details
              />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-btn
          v-if="localItem.id && !localItem.sent"
          color="success"
          variant="outlined"
          @click="$emit('mark-sent')"
        >
          Mark as Sent
        </v-btn>
        <v-spacer />
        <v-btn color="blue-darken-1" variant="text" @click="$emit('close')">Cancel</v-btn>
        <v-btn color="blue-darken-1" variant="text" @click="$emit('save', localItem)">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { customerService } from '@/services/customer.service'
import EntitySelect from '@/components/EntitySelect.vue'
import type { Invoice } from '@/types/models'

const props = defineProps<{
  modelValue: boolean
  editedItem: Partial<Invoice>
  formTitle: string
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  save: [item: Partial<Invoice>]
  'mark-sent': []
}>()

const localItem = ref<Partial<Invoice>>({ ...props.editedItem })

watch(
  () => props.editedItem,
  (newVal) => {
    localItem.value = { ...newVal }
  },
  { deep: true },
)
</script>
