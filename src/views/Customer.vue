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
        <v-icon size="default" class="mr-2" @click="showContacts(item)">mdi-card-account-details-outline</v-icon>
        <v-icon size="default" @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
      <template #item.primary_email="{ item }">
        {{ getPrimaryEmail(item) }}
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
            <!-- Invoice History -->
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
          <v-chip
            class="mr-4"
            :color="includeArchived ? 'primary' : 'default'"
            variant="outlined"
            @click="includeArchived = !includeArchived"
            clickable
          >
            <v-icon start>{{ includeArchived ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
            Include Archived
          </v-chip>
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
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="currentItem.name"
                          label="Name"
                          :rules="[v => !!v || 'Name is required']"
                        />
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="currentItem.short_code"
                          label="Short Code"
                          hint="Used for Telegram bot shorthand"
                          persistent-hint
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
                      <v-col cols="12">
                        <v-switch
                          v-model="currentItem.archived"
                          label="Archived"
                          color="warning"
                          hide-details
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
    <!-- Contacts Dialog -->
    <v-dialog v-model="contactsDialog" max-width="800" :fullscreen="smAndDown" @click:outside="closeContactsDialog">
      <v-card>
        <v-card-title>
          <span class="text-h5">Contacts for {{ selectedCustomerName }}</span>
        </v-card-title>

        <v-card-text>
          <v-data-table
            :headers="contactHeaders"
            :items="currentCustomerContacts"
            density="compact"
          >
            <template v-slot:item.primary="{ item }">
              <v-chip v-if="item.primary" color="success" size="x-small" variant="flat">Primary</v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-icon size="default" class="mr-2" @click="editContact(item)">mdi-pencil</v-icon>
              <v-icon size="default" @click="deleteContact(item)">mdi-delete</v-icon>
            </template>
          </v-data-table>

          <v-divider class="my-4" />

          <v-container>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="editedContact.name"
                  label="Name"
                  :rules="[v => !!v || 'Name is required']"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="editedContact.email"
                  label="Email"
                  :rules="[v => !!v || 'Email is required']"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-switch
                  v-model="editedContact.primary"
                  label="Primary"
                  color="success"
                  hide-details
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-btn color="primary" @click="saveContact">
                  {{ contactFormTitle }}
                </v-btn>
                <v-btn v-if="editedContactId !== -1" color="grey" variant="text" @click="cancelEditContact" class="ml-2">
                  Cancel
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="blue-darken-1" variant="text" @click="closeContactsDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" :timeout="1500" color="success">
      Item updated
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { customerService } from '@/services/customer.service'
import { invoiceService } from '@/services/invoice.service'
import { customerContactService } from '@/services/customerContact.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { usePagination } from '@/composables/usePagination'
import type { Customer, CustomerContact, Invoice } from '@/types/models'
import { formatCurrency, formatDate } from '@/utils/formatters'

const { smAndDown, mdAndDown } = useDisplay()
const { confirm } = useConfirmDialog()

const includeArchived = ref(false)

const {
  items: paginatedCustomers,
  totalItems: totalCustomers,
  loading: customersLoading,
  onOptionsUpdate,
  refresh: refreshCustomers,
} = usePagination<Customer>((page, perPage) => customerService.getPage({ page, perPage, archived: includeArchived.value }))

const invoices = ref<Invoice[]>([])
const contacts = ref<CustomerContact[]>([])
const dialog = ref(false)
const valid = ref(false)
const snackbar = ref(false)
const currentItemId = ref(-1)
const currentItem = ref<Partial<Customer>>({
  name: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  short_code: '',
  archived: false
})
const formRef = ref()

const contactsDialog = ref(false)
const selectedCustomerId = ref(-1)
const selectedCustomerName = ref('')
const editedContactId = ref(-1)

function getDefaultContact(): Partial<CustomerContact> {
  return { name: '', email: '', primary: false }
}

const editedContact = ref<Partial<CustomerContact>>(getDefaultContact())

const contactHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Primary', key: 'primary' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const contactFormTitle = computed(() => editedContactId.value === -1 ? 'Add Contact' : 'Update Contact')

const currentCustomerContacts = computed(() =>
  contacts.value.filter(c => c.customer_id === selectedCustomerId.value)
)

const allHeaders = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Short Code', key: 'short_code' },
  { title: 'Primary Email', key: 'primary_email', sortable: false },
  { title: 'Phone', key: 'phone' },
  { title: 'City', key: 'city' },
  { title: 'State', key: 'state' },
  { title: 'Unpaid Balance', key: 'unpaid_balance', sortable: true },
  { title: 'Archived', key: 'archived' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const headers = computed(() => {
  if (mdAndDown.value) {
    return allHeaders.filter(h => h.key !== 'primary_email' && h.key !== 'phone' && h.key !== 'short_code')
  }
  return allHeaders
})

const formTitle = computed(() => currentItemId.value === -1 ? 'New Customer' : 'Edit Customer')

onMounted(() => { loadData() })

async function loadContacts() {
  const allContacts: CustomerContact[] = []
  for (const customer of paginatedCustomers.value) {
    try {
      const customerContacts = await customerContactService.getAll(customer.id)
      allContacts.push(...customerContacts)
    } catch {
      // Customer may not have contacts yet
    }
  }
  contacts.value = allContacts
}

watch(paginatedCustomers, () => {
  loadContacts()
})

watch(includeArchived, () => {
  refreshCustomers()
})

async function loadData() {
  invoices.value = await invoiceService.getAll()
  await loadContacts()
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
  currentItem.value = { name: '', phone: '', address: '', city: '', state: '', zip_code: '', short_code: '', archived: false }
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
    await loadContacts()
  }
}

function close() {
  dialog.value = false
  formRef.value?.reset()
  currentItemId.value = -1
  currentItem.value = {
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    short_code: '',
    archived: false
  }
}

async function save() {
  const { valid: isValid } = await formRef.value?.validate()
  if (isValid) {
    const customerData = {
      name: currentItem.value.name,
      phone: currentItem.value.phone,
      address: currentItem.value.address,
      city: currentItem.value.city,
      state: currentItem.value.state,
      zip_code: currentItem.value.zip_code,
      short_code: currentItem.value.short_code,
      archived: currentItem.value.archived
    }
    if (currentItemId.value > -1) {
      await customerService.update(currentItemId.value, customerData)
    } else {
      await customerService.create(customerData)
    }
    refreshCustomers()
    invoices.value = await invoiceService.getAll()
    await loadContacts()
    snackbar.value = true
    setTimeout(() => close(), 300)
  }
}

function getPrimaryEmail(customer: Customer): string {
  const primaryContact = contacts.value.find(
    c => c.customer_id === customer.id && c.primary
  )
  return primaryContact?.email ?? ''
}

function showContacts(customer: Customer) {
  selectedCustomerId.value = customer.id
  selectedCustomerName.value = customer.name
  contactsDialog.value = true
}

function closeContactsDialog() {
  contactsDialog.value = false
  selectedCustomerId.value = -1
  selectedCustomerName.value = ''
  editedContactId.value = -1
  editedContact.value = getDefaultContact()
}

function editContact(contact: CustomerContact) {
  editedContactId.value = contact.id
  editedContact.value = { ...contact }
}

function cancelEditContact() {
  editedContactId.value = -1
  editedContact.value = getDefaultContact()
}

async function deleteContact(contact: CustomerContact) {
  const confirmed = await confirm(`Delete contact: ${contact.name}?`, { icon: 'mdi-alert' })
  if (confirmed) {
    await customerContactService.delete(selectedCustomerId.value, contact.id)
    await loadContacts()
  }
}

async function saveContact() {
  const contactData = {
    name: editedContact.value.name,
    email: editedContact.value.email,
    primary: editedContact.value.primary ?? false,
  }
  if (editedContactId.value > -1) {
    await customerContactService.update(selectedCustomerId.value, editedContactId.value, contactData)
  } else {
    await customerContactService.create(selectedCustomerId.value, contactData)
  }
  editedContactId.value = -1
  editedContact.value = getDefaultContact()
  await loadContacts()
}
</script>
