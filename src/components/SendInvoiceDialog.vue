<template>
  <v-dialog :model-value="modelValue" max-width="900" :fullscreen="smAndDown" @update:model-value="$emit('update:modelValue', $event)">
    <v-card v-if="invoice">
      <v-card-title>
        <span class="text-h5">Send Invoice #{{ invoice.invoice_number }}?</span>
      </v-card-title>

      <v-card-text>
        <v-row>
          <!-- Invoice Preview -->
          <v-col cols="12" md="7">
            <div class="pa-4 border rounded">
              <!-- Header -->
              <div class="d-flex justify-space-between mb-4">
                <div>
                  <img :src="essoCoffeeLogo" alt="Esso Coffee" style="height: 36px;" class="mb-1" />
                  <div class="text-body-2">4700 N 12th St #107</div>
                  <div class="text-body-2">Phoenix, AZ 85014</div>
                  <div class="text-body-2">Phone: 480.560.3067</div>
                </div>
                <div class="text-right">
                  <div class="text-h6">INVOICE # {{ invoice.invoice_number }}</div>
                  <div v-if="invoice.date" class="text-body-2">{{ formatDate(invoice.date) }}</div>
                </div>
              </div>

              <!-- Bill To -->
              <div class="mb-4">
                <span class="font-weight-bold font-italic">BILL TO:</span>
                <span class="ml-4">{{ customer?.name }}</span>
                <div v-if="customer?.address" class="ml-16 text-body-2">{{ customer.address }}</div>
                <div v-if="customer?.city || customer?.state || customer?.zip_code" class="ml-16 text-body-2">
                  {{ [customer?.city, customer?.state].filter(Boolean).join(', ') }}
                  {{ customer?.zip_code }}
                </div>
              </div>

              <!-- Line Items -->
              <v-table density="compact">
                <thead>
                  <tr class="bg-surface-variant">
                    <th class="font-weight-bold font-italic">DATE OF SERVICE</th>
                    <th class="font-weight-bold font-italic">DESCRIPTION</th>
                    <th class="font-weight-bold font-italic text-right">PRICE</th>
                    <th class="font-weight-bold font-italic text-right">QTY</th>
                    <th class="font-weight-bold font-italic text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="lineItem in invoiceItems" :key="lineItem.id">
                    <td>{{ lineItem.date_of_service ? formatDate(lineItem.date_of_service) : '' }}</td>
                    <td>{{ lineItem.description }}</td>
                    <td class="text-right">{{ formatCurrency(lineItem.price_per_unit) }}</td>
                    <td class="text-right">{{ lineItem.quantity }}</td>
                    <td class="text-right">{{ lineItem.amount != null ? formatCurrency(lineItem.amount) : '' }}</td>
                  </tr>
                </tbody>
              </v-table>

              <!-- Total -->
              <div class="d-flex flex-column align-end mt-4">
                <div class="d-flex align-center" style="max-width: 280px; width: 100%;">
                  <span class="font-weight-bold font-italic flex-grow-1 text-right mr-4">TOTAL</span>
                  <span class="font-weight-bold text-right text-no-wrap">{{ invoice.subtotal != null ? formatCurrency(invoice.subtotal) : '$0.00' }}</span>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Recipients -->
          <v-col cols="12" md="5">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">Email Recipients</v-card-title>
              <v-card-text>
                <v-alert v-if="!primaryContact" type="warning" density="compact" class="mb-3">
                  No primary contact — cannot send email
                </v-alert>
                <v-list v-else density="compact">
                  <v-list-item>
                    <template #prepend>
                      <v-chip size="x-small" color="success" variant="flat" class="mr-2">To</v-chip>
                    </template>
                    <v-list-item-title>{{ primaryContact.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ primaryContact.email }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-for="cc in ccContacts" :key="cc.id">
                    <template #prepend>
                      <v-chip size="x-small" color="info" variant="flat" class="mr-2">CC</v-chip>
                    </template>
                    <v-list-item-title>{{ cc.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ cc.email }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
                <div v-if="primaryContact && ccContacts.length === 0" class="text-body-2 text-grey mt-2">
                  No additional contacts to CC
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="$emit('update:modelValue', false)" :disabled="loading">
          Cancel
        </v-btn>
        <v-btn color="primary" @click="$emit('confirm')" :disabled="!primaryContact || loading" :loading="loading">
          Send Email
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Invoice, InvoiceItem, Customer, CustomerContact } from '@/types/models'
import essoCoffeeLogo from '@/assets/esso-coffee-logo.png'

const { smAndDown } = useDisplay()

const props = defineProps<{
  modelValue: boolean
  invoice: Invoice | null
  customer: Customer | null
  invoiceItems: InvoiceItem[]
  contacts: CustomerContact[]
  loading: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()

const primaryContact = computed(() => props.contacts.find(c => c.primary) ?? null)
const ccContacts = computed(() => props.contacts.filter(c => !c.primary))
</script>
