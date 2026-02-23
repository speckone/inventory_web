<template>
  <v-container>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Dashboard</h1>
      </v-col>
    </v-row>

    <!-- Barista Section: KPI Cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card color="warning" variant="tonal">
          <v-card-text class="d-flex align-center">
            <v-icon size="48" class="mr-4">mdi-alert-outline</v-icon>
            <div>
              <div class="text-subtitle-2 text-medium-emphasis">Low Stock Items</div>
              <div class="text-h4 font-weight-bold">{{ lowStockCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card color="error" variant="tonal">
          <v-card-text class="d-flex align-center">
            <v-icon size="48" class="mr-4">mdi-package-variant-remove</v-icon>
            <div>
              <div class="text-subtitle-2 text-medium-emphasis">Out of Stock</div>
              <div class="text-h4 font-weight-bold">{{ outOfStockCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card color="info" variant="tonal">
          <v-card-text class="d-flex align-center">
            <v-icon size="48" class="mr-4">mdi-clipboard-list-outline</v-icon>
            <div>
              <div class="text-subtitle-2 text-medium-emphasis">Open Orders</div>
              <div class="text-h4 font-weight-bold">{{ openOrdersCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Admin KPI: Unpaid Invoices -->
      <v-col v-if="authStore.isAdmin" cols="12" sm="6" md="3">
        <v-card color="warning" variant="tonal">
          <v-card-text class="d-flex align-center">
            <v-icon size="48" class="mr-4">mdi-receipt-text-outline</v-icon>
            <div>
              <div class="text-subtitle-2 text-medium-emphasis">Unpaid Invoices</div>
              <div class="text-h4 font-weight-bold">{{ formatCurrency(unpaidInvoicesTotal) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Admin KPI: Customers -->
      <v-col v-if="authStore.isAdmin" cols="12" sm="6" md="3">
        <v-card color="info" variant="tonal">
          <v-card-text class="d-flex align-center">
            <v-icon size="48" class="mr-4">mdi-account-group-outline</v-icon>
            <div>
              <div class="text-subtitle-2 text-medium-emphasis">Customers</div>
              <div class="text-h4 font-weight-bold">{{ customerCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-2">
      <v-col cols="12">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-btn color="primary" class="mr-3" prepend-icon="mdi-warehouse" @click="router.push('/inventory')">
              Go to Inventory
            </v-btn>
            <v-btn color="primary" class="mr-3" prepend-icon="mdi-cart-plus" @click="createOrder">
              Create Order
            </v-btn>
            <v-btn v-if="authStore.isAdmin" color="primary" prepend-icon="mdi-receipt-text-plus" @click="router.push('/invoices')">
              New Invoice
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Low Stock Items List -->
    <v-row class="mt-2">
      <v-col cols="12">
        <v-card>
          <v-card-title>Top 5 Low Stock Items</v-card-title>
          <v-card-text v-if="!loading && topLowStockItems.length === 0">
            <p class="text-medium-emphasis">No low stock items found.</p>
          </v-card-text>
          <v-list v-else>
            <v-list-item
              v-for="item in topLowStockItems"
              :key="item.id"
              :title="item.productName"
              :subtitle="`Quantity: ${item.quantity} / Reorder Level: ${item.reorder_level}`"
            >
              <template #prepend>
                <v-icon :color="item.quantity === 0 ? 'error' : 'warning'">
                  {{ item.quantity === 0 ? 'mdi-package-variant-remove' : 'mdi-alert-outline' }}
                </v-icon>
              </template>
              <template #append>
                <v-chip
                  :color="item.quantity === 0 ? 'error' : 'warning'"
                  size="small"
                  variant="flat"
                >
                  {{ item.quantity === 0 ? 'Out of Stock' : 'Low Stock' }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { InventoryItem, Product, Order, Invoice, Customer } from '@/types/models'
import { inventoryService } from '@/services/inventory.service'
import { productService } from '@/services/product.service'
import { orderService } from '@/services/order.service'
import { invoiceService } from '@/services/invoice.service'
import { customerService } from '@/services/customer.service'
import { useAuthStore } from '@/stores/auth'
import { useSnackbarStore } from '@/stores/snackbar'
import { formatCurrency } from '@/utils/formatters'

const router = useRouter()
const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()

const loading = ref(false)

const inventoryItems = ref<InventoryItem[]>([])
const products = ref<Product[]>([])
const openOrders = ref<Order[]>([])
const invoices = ref<Invoice[]>([])
const customers = ref<Customer[]>([])

// Barista KPIs
const lowStockCount = computed(() => {
  return inventoryItems.value.filter(
    (item) => item.quantity <= item.reorder_level
  ).length
})

const outOfStockCount = computed(() => {
  return inventoryItems.value.filter((item) => item.quantity === 0).length
})

const openOrdersCount = computed(() => {
  return openOrders.value.length
})

// Admin KPIs
const unpaidInvoicesTotal = computed(() => {
  return invoices.value
    .filter((inv) => !inv.paid)
    .reduce((sum, inv) => sum + (inv.subtotal ?? 0), 0)
})

const customerCount = computed(() => {
  return customers.value.length
})

// Low stock items with product names, sorted by quantity ascending, top 5
const topLowStockItems = computed(() => {
  const productMap = new Map(products.value.map((p) => [p.id, p.name]))

  return inventoryItems.value
    .filter((item) => item.quantity <= item.reorder_level)
    .map((item) => ({
      ...item,
      productName: productMap.get(item.product_id) ?? `Product #${item.product_id}`,
    }))
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5)
})

async function createOrder() {
  try {
    await orderService.create()
    router.push('/orders')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create order'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  }
}

async function loadData() {
  loading.value = true
  try {
    // Fetch data common to all users
    const basePromises: [Promise<InventoryItem[]>, Promise<Product[]>, Promise<Order[]>] = [
      inventoryService.getAll(),
      productService.getAll(),
      orderService.getByStatus('New'),
    ]

    const [inv, prod, orders] = await Promise.all(basePromises)
    inventoryItems.value = inv
    products.value = prod
    openOrders.value = orders

    // Admin-only data
    if (authStore.isAdmin) {
      const [inv_data, cust_data] = await Promise.all([
        invoiceService.getAll(),
        customerService.getAll(),
      ])
      invoices.value = inv_data
      customers.value = cust_data
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard data'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
