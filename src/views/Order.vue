<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate />
    <v-data-table
      :headers="headers"
      :items="items"
      item-value="id"
      :group-by="[{ key: 'order_id', order: 'desc' }]"
      density="compact"
    >
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-toolbar-title>Active Orders</v-toolbar-title>
          <v-divider class="mx-4" inset vertical />
          <v-spacer />
        </v-toolbar>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-tooltip location="start">
          <template #activator="{ props }">
            <v-icon size="small" v-bind="props" @click="deleteItem(item)">
              mdi-delete
            </v-icon>
          </template>
          <span>Remove item from order</span>
        </v-tooltip>
      </template>

      <template v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }">
        <tr>
          <td :colspan="columns.length">
            <v-btn
              size="small"
              variant="text"
              :icon="isGroupOpen(item) ? '$expand' : '$next'"
              @click="toggleGroup(item)"
            />
            {{ getOrderStatus(item.value) }} Order: {{ item.value }} - {{ getOrderDate(item.value) }}
            <v-divider class="mx-8" inset vertical />
            Cost {{ formatCurrency(getOrderCost(item.value)) }}

            <span class="ml-4">
              <v-tooltip v-if="isNew(item.value)" location="end">
                <template #activator="{ props }">
                  <v-icon size="small" v-bind="props" @click="submitOrder(item.value)">mdi-send</v-icon>
                </template>
                <span>Submit order</span>
              </v-tooltip>

              <v-tooltip v-if="isSubmitted(item.value)" location="start">
                <template #activator="{ props }">
                  <v-icon size="small" v-bind="props" @click="receiveOrder(item.value)">mdi-check-circle</v-icon>
                </template>
                <span>Mark order as received</span>
              </v-tooltip>

              <v-divider v-if="isNew(item.value)" class="mx-4" inset vertical />

              <v-tooltip v-if="isNew(item.value)" location="end">
                <template #activator="{ props }">
                  <v-icon size="small" v-bind="props" @click="cancelOrder(item.value)">mdi-delete</v-icon>
                </template>
                <span>Cancel Order</span>
              </v-tooltip>
            </span>
          </td>
        </tr>
      </template>

      <template v-slot:item.quantity="{ item }">
        <EditableCell
          :model-value="item.quantity"
          label="Update Quantity"
          :rules="[v => !!v || 'Quantity is required']"
          @save="(val: number) => updateItemQuantity(item, val)"
        />
      </template>
    </v-data-table>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useOrderView } from '@/composables/useOrderView'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EditableCell from '@/components/EditableCell.vue'
import { formatCurrency } from '@/utils/formatters'

const {
  loading,
  headers,
  items,
  getOrderDate,
  getOrderStatus,
  getOrderCost,
  isNew,
  isSubmitted,
  loadData,
  submitOrder,
  receiveOrder,
  cancelOrder,
  updateItemQuantity,
  deleteItem,
} = useOrderView('New')

onMounted(() => {
  loadData()
})
</script>
