<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate />
    <v-data-table
      :headers="headers"
      :items="items"
      :search="search"
    >
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-toolbar-title>Products</v-toolbar-title>
          <v-divider class="mx-4" inset vertical />
          <v-spacer />
          <v-text-field
            v-model="search"
            append-inner-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            density="compact"
          />
        </v-toolbar>
      </template>

      <template v-slot:item.unit_price="{ item }">
        {{ formatCurrency(item.unit_price) }}
      </template>

      <template v-slot:item.actions="{ item }">
        <v-icon size="small" class="mr-2" @click="editItem(item)">
          mdi-pencil
        </v-icon>
        <v-icon size="small" class="mr-2" @click="deleteItem(item)">
          mdi-delete
        </v-icon>
        <v-icon size="small" @click="showOrderHistory(item)">
          mdi-history
        </v-icon>
      </template>

      <template v-slot:bottom>
        <v-toolbar flat color="white">
          <v-spacer />
          <v-dialog v-model="dialog" max-width="500" @click:outside="close">
            <template v-slot:activator="{ props }">
              <v-btn color="primary" class="mb-2" v-bind="props">New Product</v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="text-h5">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedItem.name"
                        label="Name"
                        :rules="[v => !!v || 'Name is required']"
                      />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model.number="editedItem.unit_price"
                        label="Unit price"
                        type="number"
                        :rules="[v => !!v || 'Price is required']"
                      />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <EntitySelect
                        v-model="editedItem.category_id"
                        label="Category"
                        :load-items="categoryService.getAll"
                      />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <EntitySelect
                        v-model="editedItem.unit_id"
                        label="Unit"
                        :load-items="unitService.getAll"
                      />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <EntitySelect
                        v-model="editedItem.vendor_id"
                        label="Vendor"
                        :load-items="vendorService.getAll"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer />
                <v-btn color="blue-darken-1" variant="text" @click="close">Cancel</v-btn>
                <v-btn color="blue-darken-1" variant="text" @click="save">Save</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
    </v-data-table>

    <!-- Order History Dialog -->
    <v-dialog v-model="historyDialog" max-width="500" @click:outside="closeHistory">
      <v-card>
        <v-card-title>
          <span class="text-h5">Order history for {{ historyProductName }}</span>
        </v-card-title>
        <v-table>
          <thead>
            <tr>
              <th class="text-left">Order ID</th>
              <th class="text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in historyData" :key="order.id">
              <td>{{ order.id }}</td>
              <td>{{ order.date }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { productService } from '@/services/product.service'
import { unitService } from '@/services/unit.service'
import { vendorService } from '@/services/vendor.service'
import { categoryService } from '@/services/category.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useSnackbarStore } from '@/stores/snackbar'
import EntitySelect from '@/components/EntitySelect.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { formatCurrency } from '@/utils/formatters'
import type { Product, Unit, Vendor, Category, Order } from '@/types/models'

const { confirm } = useConfirmDialog()
const snackbarStore = useSnackbarStore()

const search = ref('')
const dialog = ref(false)
const loading = ref(false)
const historyDialog = ref(false)
const historyProductName = ref('')
const historyData = ref<Order[]>([])

const productData = ref<Product[]>([])
const unitData = ref<Unit[]>([])
const vendorData = ref<Vendor[]>([])
const categoryData = ref<Category[]>([])

const editedId = ref(-1)

const defaultItem: Partial<Product> = {
  name: '',
  unit_price: 0,
}

const editedItem = ref<Partial<Product>>({ ...defaultItem })

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Unit', key: 'unit' },
  { title: 'Category', key: 'category' },
  { title: 'Unit Price', key: 'unit_price' },
  { title: 'Vendor', key: 'vendor' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const formTitle = computed(() => {
  return editedId.value === -1 ? 'New Product' : 'Edit Product'
})

const items = computed(() => {
  if (productData.value && unitData.value && vendorData.value && categoryData.value) {
    const unitMap = new Map(unitData.value.map((u) => [u.id, u]))
    const categoryMap = new Map(categoryData.value.map((c) => [c.id, c]))
    const vendorMap = new Map(vendorData.value.map((v) => [v.id, v]))

    return productData.value.map((product) => {
      const productUnit = unitMap.get(product.unit_id)
      const productCategory = categoryMap.get(product.category_id)
      const productVendor = vendorMap.get(product.vendor_id)
      return {
        ...product,
        unit: productUnit?.name ?? '',
        category: productCategory?.name ?? 'Null',
        vendor: productVendor?.name ?? '',
      }
    })
  }
  return []
})

async function loadProducts() {
  productData.value = await productService.getAll()
}

async function loadData() {
  loading.value = true
  try {
    const [products, units, vendors, categories] = await Promise.all([
      productService.getAll(),
      unitService.getAll(),
      vendorService.getAll(),
      categoryService.getAll(),
    ])
    productData.value = products
    unitData.value = units
    vendorData.value = vendors
    categoryData.value = categories
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load product data'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function editItem(item: Product) {
  editedId.value = item.id
  editedItem.value = { ...item }
  dialog.value = true
}

async function deleteItem(product: Product) {
  const confirmed = await confirm('Delete Product: ' + product.name + '?', {
    icon: 'mdi-alert',
  })
  if (confirmed) {
    try {
      await productService.delete(product.id)
      await loadProducts()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete product'
      snackbarStore.showSnackbar({ text: message, color: 'error' })
    }
  }
}

async function showOrderHistory(item: Product) {
  try {
    historyData.value = await productService.getHistory(item.id)
    historyProductName.value = item.name
    historyDialog.value = true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load order history'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  }
}

function closeHistory() {
  historyDialog.value = false
}

function close() {
  dialog.value = false
  editedId.value = -1
  editedItem.value = { ...defaultItem }
}

async function save() {
  try {
    if (editedId.value > -1) {
      await productService.update(editedId.value, {
        name: editedItem.value.name,
        unit_price: editedItem.value.unit_price,
        unit_id: editedItem.value.unit_id,
        vendor_id: editedItem.value.vendor_id,
        category_id: editedItem.value.category_id,
      })
    } else {
      await productService.create({
        name: editedItem.value.name,
        unit_price: editedItem.value.unit_price,
        unit_id: editedItem.value.unit_id,
        vendor_id: editedItem.value.vendor_id,
        category_id: editedItem.value.category_id,
      })
    }
    close()
    await loadProducts()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save product'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  }
}

onMounted(() => {
  loadData()
})
</script>
