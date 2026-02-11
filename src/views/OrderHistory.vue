<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="items"
      item-value="id"
      :group-by="[{ key: 'order_id', order: 'desc' }]"
      density="compact"
    >
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-toolbar-title>Orders</v-toolbar-title>
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
                  <v-icon size="small" v-bind="props" @click="deleteOrder(item.value)">mdi-delete</v-icon>
                </template>
                <span>Delete Order</span>
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
import { ref, computed, onMounted } from 'vue'
import { productService } from '@/services/product.service'
import { unitService } from '@/services/unit.service'
import { orderService } from '@/services/order.service'
import { orderItemService } from '@/services/orderItem.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useSnackbarStore } from '@/stores/snackbar'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EditableCell from '@/components/EditableCell.vue'
import { formatCurrency } from '@/utils/formatters'
import type { Product, Unit, Order, OrderItem } from '@/types/models'

const { confirm } = useConfirmDialog()
const snackbarStore = useSnackbarStore()

const productData = ref<Product[]>([])
const orderData = ref<Order[]>([])
const orderItemData = ref<OrderItem[]>([])
const unitData = ref<Unit[]>([])

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Quantity', key: 'quantity' },
  { title: 'Product', key: 'product' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const items = computed(() => {
  if (orderData.value && orderItemData.value && productData.value && unitData.value) {
    const openOrderIds = orderData.value.map((order) => order.id)
    return orderItemData.value
      .map((orderItem) => {
        const orderProduct = productData.value.find((p) => p.id === orderItem.product_id)
        const productUnit = orderProduct
          ? unitData.value.find((u) => u.id === orderProduct.unit_id)
          : undefined
        return {
          ...orderItem,
          product: orderProduct?.name ?? '',
          unit: productUnit?.name ?? '',
        }
      })
      .filter((orderItem) => openOrderIds.includes(orderItem.order_id))
  }
  return []
})

function getOrderDate(orderId: number): string {
  const order = orderData.value.find((o) => o.id === orderId)
  return order ? new Date(order.date).toLocaleString() : ''
}

function getOrderStatus(orderId: number): string {
  const order = orderData.value.find((o) => o.id === orderId)
  return order?.status ?? ''
}

function getOrderCost(orderId: number): number {
  const order = orderData.value.find((o) => o.id === orderId)
  return order?.cost ?? 0
}

function isNew(orderId: number): boolean {
  const order = orderData.value.find((o) => o.id === orderId)
  return order?.status === 'New'
}

function isSubmitted(orderId: number): boolean {
  const order = orderData.value.find((o) => o.id === orderId)
  return order?.status === 'Submitted'
}

async function loadOrders() {
  orderData.value = await orderService.getByStatus('Received')
}

async function loadOrderItems() {
  orderItemData.value = await orderItemService.getAll()
}

async function loadData() {
  orderData.value = await orderService.getByStatus('Received')
  productData.value = await productService.getAll()
  orderItemData.value = await orderItemService.getAll()
  unitData.value = await unitService.getAll()
}

async function submitOrder(orderId: number) {
  const confirmed = await confirm('Send order to Sharon?', {
    icon: 'mdi-alert',
    buttonTrueText: 'Yes! Send my order.',
  })
  if (confirmed) {
    await orderService.updateStatus(orderId, 'Submitted')
    await loadOrders()
    snackbarStore.showSnackbar({
      show: true,
      text: 'Order submitted',
      color: 'success',
      timeout: 2000,
    })
  }
}

async function receiveOrder(orderId: number) {
  await orderService.updateStatus(orderId, 'Received')
  await loadOrders()
  snackbarStore.showSnackbar({
    show: true,
    text: 'Order received',
    color: 'success',
    timeout: 2000,
  })
}

async function deleteOrder(orderId: number) {
  const confirmed = await confirm('Delete Order: ' + orderId + '?', {
    icon: 'mdi-alert',
  })
  if (confirmed) {
    await orderService.delete(orderId)
    await loadOrderItems()
    await loadOrders()
  }
}

async function updateItemQuantity(item: OrderItem, quantity: number) {
  await orderItemService.updateQuantity(item.id, quantity)
  await loadOrderItems()
}

async function deleteItem(orderItem: OrderItem) {
  const confirmed = await confirm('Delete Order Item: ' + orderItem.product + '?', {
    icon: 'mdi-alert',
  })
  if (confirmed) {
    await orderItemService.delete(orderItem.id)
    await loadOrderItems()
  }
}

onMounted(() => {
  loadData()
})
</script>
