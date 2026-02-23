<template>
  <v-card class="ma-4">
    <v-progress-linear v-if="loading" indeterminate />
    <v-data-table
      :headers="headers"
      :items="items"
      item-value="id"
      :sort-by="[{ key: 'id' }]"
      :search="debouncedSearch"
      :custom-filter="filterByCategory"
      :items-per-page-options="[10, 25, 50, 100, { value: -1, title: 'All' }]"
      :row-props="getRowProps"
      fixed-header
      height="700"
      show-select
    >
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>Inventory</v-toolbar-title>
          <v-divider class="mx-4" inset vertical />
          <v-text-field v-model="searchProduct" append-icon="mdi-magnify" label="Search" />
          <v-spacer />
          <v-btn color="primary" class="mb-2 mr-2" @click="dialog = true">New Item</v-btn>
          <v-btn color="secondary" class="mb-2" @click="createOrder">Create Order</v-btn>
        </v-toolbar>
        <v-chip-group v-model="searchCategory" selected-class="text-primary" class="px-4 pb-2">
          <v-chip :value="null" filter>All</v-chip>
          <v-chip v-for="name in categoryNames" :key="name" :value="name" filter>{{ name }}</v-chip>
        </v-chip-group>
      </template>
      <template #item.cost="{ item }">
        {{ formatCurrency(item.cost) }}
      </template>
      <template #item.quantity="{ item }">
        <EditableCell
          :model-value="item.quantity"
          label="Update Quantity"
          :rules="[v => !!v || 'Quantity is required']"
          @save="(val) => updateItemQuantity(item, val)"
        />
      </template>
      <template #item.actions="{ item }">
        <v-icon size="small" class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon size="small" @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="500" @click:outside="close">
      <v-card>
        <v-form v-model="valid" ref="formRef">
          <v-card-title>
            <span class="text-h5">{{ formTitle }}</span>
          </v-card-title>
          <EntitySelect
            v-model="currentItem.product_id"
            label="Product"
            :load-items="productService.getAll"
            :rules="[v => !!v || 'Product is required']"
          />
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field label="Quantity" v-model.number="currentItem.quantity" :rules="[v => !!v || 'Quantity is required']" />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-text-field label="Capacity" v-model.number="currentItem.capacity" :rules="[v => !!v || 'Capacity is required']" />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-text-field label="Reorder Level" v-model.number="currentItem.reorder_level" :rules="[v => !!v || 'Reorder Level is required']" />
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-darken-1" variant="text" @click="close">Cancel</v-btn>
            <v-btn color="blue-darken-1" variant="text" @click="save">Save</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
    <div v-if="items.length === 0 && !loading" class="text-center pa-8 text-grey">No inventory items found</div>
    <v-snackbar v-model="snackbar" :timeout="1500" color="success">Item updated</v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { InventoryItem, Product, Category, Unit } from '@/types/models'
import { inventoryService } from '@/services/inventory.service'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { unitService } from '@/services/unit.service'
import { orderService } from '@/services/order.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useSnackbarStore } from '@/stores/snackbar'
import { formatCurrency } from '@/utils/formatters'
import EditableCell from '@/components/EditableCell.vue'
import EntitySelect from '@/components/EntitySelect.vue'

const router = useRouter()
const { confirm } = useConfirmDialog()
const snackbarStore = useSnackbarStore()

const inventoryItems = ref<InventoryItem[]>([])
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const units = ref<Unit[]>([])

const dialog = ref(false)
const valid = ref(false)
const formRef = ref()
const loading = ref(false)
const snackbar = ref(false)
const searchProduct = ref('')
const debouncedSearch = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchProduct, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = val
  }, 300)
})
const searchCategory = ref<string | null>(null)
const editedIndex = ref(-1)

const defaultItem: Partial<InventoryItem> = {
  quantity: 0,
  capacity: 0,
  reorder_level: 0,
}

const currentItem = ref<Partial<InventoryItem>>({ ...defaultItem })

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Product', key: 'product' },
  { title: 'Unit', key: 'unit' },
  { title: 'Category', key: 'category' },
  { title: 'Quantity', key: 'quantity' },
  { title: 'Capacity', key: 'capacity' },
  { title: 'Reorder Level', key: 'reorder_level' },
  { title: 'Cost', key: 'cost' },
  { title: 'Needed', key: 'needed_at_store' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const items = computed(() => {
  const productMap = new Map(products.value.map((p) => [p.id, p]))
  const categoryMap = new Map(categories.value.map((c) => [c.id, c]))
  const unitMap = new Map(units.value.map((u) => [u.id, u]))

  let result = inventoryItems.value.map((inv) => {
    const product = productMap.get(inv.product_id)
    const category = product ? categoryMap.get(product.category_id) : undefined
    const unit = product ? unitMap.get(product.unit_id) : undefined
    return {
      ...inv,
      product: product?.name ?? '',
      category: category?.name ?? 'Null',
      unit: unit?.name ?? '',
      cost: product ? product.unit_price * inv.quantity : 0,
    }
  })

  if (searchCategory.value) {
    result = result.filter((item) => item.category === searchCategory.value)
  }

  return result
})

const categoryNames = computed(() => {
  return categories.value.map((c) => c.name)
})

const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'New Item' : 'Edit Item'
})

function getRowProps({ item }: { item: any }) {
  if (item.quantity === 0) return { class: 'bg-red-lighten-5' }
  if (item.quantity <= item.reorder_level) return { class: 'bg-amber-lighten-5' }
  return {}
}

function filterByCategory(_value: string, query: string, item?: { raw: Record<string, unknown> }): boolean {
  if (!query) return true
  const productName = item?.raw?.product as string | undefined
  if (!productName) return false
  return productName.toLowerCase().includes(query.toLowerCase())
}

async function loadData() {
  loading.value = true
  try {
    const [inv, prod, cat, un] = await Promise.all([
      inventoryService.getAll(),
      productService.getAll(),
      categoryService.getAll(),
      unitService.getAll(),
    ])
    inventoryItems.value = inv
    products.value = prod
    categories.value = cat
    units.value = un
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load inventory data'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function editItem(item: InventoryItem & { product: string; category: string; unit: string }) {
  editedIndex.value = inventoryItems.value.findIndex((i) => i.id === item.id)
  currentItem.value = {
    id: item.id,
    product_id: item.product_id,
    quantity: item.quantity,
    capacity: item.capacity,
    reorder_level: item.reorder_level,
  }
  dialog.value = true
}

async function deleteItem(item: InventoryItem) {
  const confirmed = await confirm('Are you sure you want to delete this item?', {
    title: 'Delete Item',
    icon: 'mdi-alert',
    buttonTrueText: 'Delete',
  })
  if (confirmed) {
    try {
      await inventoryService.delete(item.id)
      const index = inventoryItems.value.findIndex((i) => i.id === item.id)
      if (index > -1) {
        inventoryItems.value.splice(index, 1)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete item'
      snackbarStore.showSnackbar({ text: message, color: 'error' })
    }
  }
}

function close() {
  dialog.value = false
  editedIndex.value = -1
  currentItem.value = { ...defaultItem }
  formRef.value?.reset()
}

async function save() {
  if (!valid.value) return
  try {
    if (editedIndex.value > -1) {
      const updated = await inventoryService.update(currentItem.value.id!, {
        product_id: currentItem.value.product_id,
        quantity: currentItem.value.quantity,
        capacity: currentItem.value.capacity,
        reorder_level: currentItem.value.reorder_level,
      })
      inventoryItems.value.splice(editedIndex.value, 1, updated)
    } else {
      const created = await inventoryService.create({
        product_id: currentItem.value.product_id,
        quantity: currentItem.value.quantity,
        capacity: currentItem.value.capacity,
        reorder_level: currentItem.value.reorder_level,
      })
      inventoryItems.value.push(created)
    }
    snackbar.value = true
    close()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save item'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  }
}

async function updateItemQuantity(item: InventoryItem, quantity: number) {
  try {
    const updated = await inventoryService.update(item.id, { quantity })
    const index = inventoryItems.value.findIndex((i) => i.id === item.id)
    if (index > -1) {
      inventoryItems.value[index] = updated
    }
    snackbar.value = true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update quantity'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  }
}

async function createOrder() {
  const confirmed = await confirm('Completed inventory?', {
    icon: 'mdi-alert',
    buttonTrueText: 'Yes! Create my order.',
  })
  if (confirmed) {
    try {
      await orderService.create()
      router.push('/orders')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order'
      snackbarStore.showSnackbar({ text: message, color: 'error' })
    }
  }
}

onMounted(() => {
  loadData()
})
</script>
