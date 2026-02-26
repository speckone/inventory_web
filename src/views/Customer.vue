<template>
  <v-card class="ma-4">
    <v-data-table-server
      :headers="headers"
      :items="paginatedCustomers"
      :items-length="totalCustomers"
      :loading="customersLoading"
      :items-per-page-options="[10, 25, 50, { value: -1, title: 'All' }]"
      show-expand
      @update:options="onOptionsUpdate"
    >
      <template #item.actions="{ item }">
        <v-icon size="default" class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon size="default" @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
      <template #item.unpaid_balance="{ item }">
        <v-chip v-if="getUnpaidBalance(item.id) > 0" color="warning" size="small" variant="flat">
          {{ formatCurrency(getUnpaidBalance(item.id)) }}
        </v-chip>
        <span v-else class="text-grey">$0.00</span>
      </template>
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-4">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-2 font-weight-bold">Invoice History</span>
              <v-btn size="small" color="primary" prepend-icon="mdi-plus" @click="$router.push('/invoices')">New Invoice</v-btn>
            </div>
            <v-table v-if="getCustomerInvoices(item.id).length > 0" density="compact">
              <thead><tr><th>Invoice #</th><th>Date</th><th>Subtotal</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="inv in getCustomerInvoices(item.id)" :key="inv.id">
                  <td>{{ inv.invoice_number }}</td>
                  <td>{{ inv.date ? formatDate(inv.date) : '' }}</td>
                  <td>{{ inv.subtotal != null ? formatCurrency(inv.subtotal) : '' }}</td>
                  <td><v-chip :color="inv.paid ? 'success' : 'warning'" size="x-small" variant="flat">{{ inv.paid ? 'Paid' : 'Unpaid' }}</v-chip></td>
                </tr>
              </tbody>
            </v-table>
            <div v-else class="text-grey text-body-2">No invoices for this customer</div>
          </td>
        </tr>
      </template>
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>Customers</v-toolbar-title>
          <v-divider class="mx-4" inset vertical />
          <v-spacer />
          <v-btn color="primary" @click="openNew">New Customer</v-btn>
        </v-toolbar>
      </template>
    </v-data-table-server>

    <v-dialog v-model="dialog" max-width="600" :fullscreen="smAndDown" @click:outside="close">
      <v-card>
              <v-form v-model="valid" ref="formRef">
                <v-card-title>
                  <span class="text-h5">{{ formTitle }}</span>
                </v-card-title>
                <v-card-text>
                  <v-container>
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="currentItem.name"
                          label="Name"
                          :rules="[v => !!v || 'Name is required']"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="currentItem.email"
                          label="Email"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="currentItem.phone"
                          label="Phone"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="currentItem.address"
                          label="Address"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="currentItem.city"
                          label="City"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="currentItem.state"
                          label="State"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="currentItem.zip_code"
                          label="Zip Code"
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
              </v-form>
            </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" :timeout="1500" color="success">
      Item updated
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import { customerService } from '@/services/customer.service'
import { invoiceService } from '@/services/invoice.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { usePagination } from '@/composables/usePagination'
import type { Customer, Invoice } from '@/types/models'
import { formatCurrency, formatDate } from '@/utils/formatters'

const { smAndDown, mdAndDown } = useDisplay()
const { confirm } = useConfirmDialog()

const {
  items: paginatedCustomers,
  totalItems: totalCustomers,
  loading: customersLoading,
  onOptionsUpdate,
  refresh: refreshCustomers,
} = usePagination<Customer>((page, perPage) => customerService.getPage({ page, perPage }))

const invoices = ref<Invoice[]>([])
const dialog = ref(false)
const valid = ref(false)
const snackbar = ref(false)
const currentItemId = ref(-1)
const currentItem = ref<Partial<Customer>>({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: ''
})
const formRef = ref()

const allHeaders = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'City', key: 'city' },
  { title: 'State', key: 'state' },
  { title: 'Unpaid Balance', key: 'unpaid_balance', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const headers = computed(() => {
  if (mdAndDown.value) {
    return allHeaders.filter(h => h.key !== 'email' && h.key !== 'phone')
  }
  return allHeaders
})

const formTitle = computed(() => currentItemId.value === -1 ? 'New Customer' : 'Edit Customer')

onMounted(() => { loadData() })

async function loadData() {
  invoices.value = await invoiceService.getAll()
}

function getUnpaidBalance(customerId: number): number {
  return invoices.value
    .filter(inv => inv.customer_id === customerId && !inv.paid)
    .reduce((sum, inv) => sum + (inv.subtotal ?? 0), 0)
}

function getCustomerInvoices(customerId: number): Invoice[] {
  return invoices.value.filter(inv => inv.customer_id === customerId)
}

function openNew() {
  currentItemId.value = -1
  currentItem.value = { name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: '' }
  dialog.value = true
}

function editItem(item: Customer) {
  currentItem.value = { ...item }
  currentItemId.value = item.id
  dialog.value = true
}

async function deleteItem(item: Customer) {
  const confirmed = await confirm(`Delete Customer: ${item.name}?`, { icon: 'mdi-alert' })
  if (confirmed) {
    await customerService.delete(item.id)
    refreshCustomers()
    invoices.value = await invoiceService.getAll()
  }
}

function close() {
  dialog.value = false
  formRef.value?.reset()
  currentItemId.value = -1
  currentItem.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  }
}

async function save() {
  const { valid: isValid } = await formRef.value?.validate()
  if (isValid) {
    const customerData = {
      name: currentItem.value.name,
      email: currentItem.value.email,
      phone: currentItem.value.phone,
      address: currentItem.value.address,
      city: currentItem.value.city,
      state: currentItem.value.state,
      zip_code: currentItem.value.zip_code
    }
    if (currentItemId.value > -1) {
      await customerService.update(currentItemId.value, customerData)
    } else {
      await customerService.create(customerData)
    }
    refreshCustomers()
    invoices.value = await invoiceService.getAll()
    snackbar.value = true
    setTimeout(() => close(), 300)
  }
}
</script>
