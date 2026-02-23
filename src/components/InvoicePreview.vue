<template>
  <v-dialog :model-value="modelValue" max-width="800" @update:model-value="$emit('update:modelValue', $event)">
    <v-card v-if="invoice" class="pa-6">
      <!-- Header -->
      <div class="d-flex justify-space-between mb-6">
        <div>
          <img :src="essoCoffeeLogo" alt="Esso Coffee" style="height: 40px;" class="mb-2" />
          <div class="text-body-2">4700 N 12th St #107</div>
          <div class="text-body-2">Phoenix, AZ 85014</div>
          <div class="text-body-2">Phone: 480.560.3067</div>
        </div>
        <div class="text-right">
          <div class="text-h6">INVOICE # {{ invoice.invoice_number }}</div>
          <v-chip :color="invoice.paid ? 'success' : 'warning'" size="small" variant="flat" class="mt-2">
            {{ invoice.paid ? 'Paid' : 'Unpaid' }}
          </v-chip>
        </div>
      </div>

      <!-- Bill To -->
      <div class="mb-6">
        <span class="font-weight-bold font-italic">BILL TO:</span>
        <span class="ml-4">{{ customer?.name }}</span>
        <div v-if="customer?.address" class="ml-16 text-body-2">{{ customer.address }}</div>
        <div v-if="customer?.city || customer?.state || customer?.zip_code" class="ml-16 text-body-2">
          {{ [customer?.city, customer?.state].filter(Boolean).join(', ') }}
          {{ customer?.zip_code }}
        </div>
      </div>

      <!-- Line Items Table -->
      <v-table density="compact">
        <thead>
          <tr class="bg-surface-variant">
            <th class="font-weight-bold font-italic">DATE OF SERVICE</th>
            <th class="font-weight-bold font-italic">DESCRIPTION</th>
            <th class="font-weight-bold font-italic text-right">PRICE</th>
            <th class="font-weight-bold font-italic text-right">QUANTITY</th>
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

      <!-- Totals -->
      <div class="d-flex flex-column align-end mt-6">
        <div class="d-flex" style="width: 280px;">
          <span class="font-weight-bold font-italic flex-grow-1 text-right mr-4">TOTAL</span>
          <span class="font-weight-bold text-right" style="width: 120px;">{{ invoice.subtotal != null ? formatCurrency(invoice.subtotal) : '$0.00' }}</span>
        </div>
      </div>

      <v-card-actions class="mt-4">
        <v-spacer />
        <v-btn color="primary" variant="text" @click="$emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Invoice, InvoiceItem, Customer } from '@/types/models'
import essoCoffeeLogo from '@/assets/esso-coffee-logo.png'

defineProps<{
  modelValue: boolean
  invoice: Invoice | null
  customer: Customer | null
  invoiceItems: InvoiceItem[]
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>
