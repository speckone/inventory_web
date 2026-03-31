<template>
  <v-card class="ma-4">
    <v-progress-linear v-if="loading" indeterminate />
    <v-data-table
      :headers="headers"
      :items="items"
      :search="search"
      :group-by="[{ key: 'customer' }]"
      :items-per-page-options="[10, 25, 50, { value: -1, title: 'All' }]"
    >
      <template v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }">
        <tr>
          <td :colspan="columns.length">
            <v-btn
              size="small"
              variant="text"
              :icon="isGroupOpen(item) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              @click="toggleGroup(item)"
            />
            <span class="font-weight-bold">{{ item.value }}</span>
            <span class="ml-4 text-grey">
              Unpaid Balance: {{ formatCurrency(getCustomerUnpaidTotal(item.value)) }}
            </span>
          </td>
        </tr>
      </template>

      <template v-slot:top>
        <v-toolbar flat color="white" class="flex-wrap" style="height: auto; min-height: 64px;">
          <v-toolbar-title>Invoices</v-toolbar-title>
          <v-chip class="ml-4" color="error" variant="tonal">
            Total Unpaid: {{ formatCurrency(totalUnpaid) }}
          </v-chip>
          <v-divider class="mx-4" inset vertical />
          <v-spacer />
          <v-row align="center" justify="end" class="flex-nowrap ma-0" style="flex: 0 1 auto; gap: 8px;">
            <v-col cols="12" sm="6" md="4" class="pa-0">
              <v-text-field
                v-model="search"
                append-inner-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
                density="compact"
              />
            </v-col>
            <v-chip
              class="mr-2"
              :color="hidePaid ? 'primary' : 'default'"
              variant="outlined"
              @click="hidePaid = !hidePaid"
              clickable
            >
              <v-icon start>{{ hidePaid ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
              Hide Paid
            </v-chip>
            <v-chip
              class="mr-4"
              :color="hideOldInvoices ? 'primary' : 'default'"
              variant="outlined"
              @click="hideOldInvoices = !hideOldInvoices"
              clickable
            >
              <v-icon start>{{ hideOldInvoices ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
              Hide Old (&gt;1mo)
            </v-chip>
          </v-row>
          <v-btn color="primary" @click="openNew">New Invoice</v-btn>
        </v-toolbar>
      </template>

      <template v-slot:item.date="{ item }">
        {{ item.date ? formatDate(item.date) : '' }}
      </template>

      <template v-slot:item.subtotal="{ item }">
        {{ item.subtotal != null ? formatCurrency(item.subtotal) : '' }}
      </template>

      <template v-slot:item.paid="{ item }">
        <v-chip :color="item.paid ? 'success' : 'warning'" size="small" variant="flat">
          {{ item.paid ? 'Paid' : 'Unpaid' }}
        </v-chip>
      </template>

      <template v-slot:item.sent="{ item }">
        <v-icon v-if="item.sent" color="success" size="small">mdi-email-check</v-icon>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-icon size="default" class="mr-2" @click="editItem(item)">
          mdi-pencil
        </v-icon>
        <v-icon size="default" class="mr-2" @click="deleteItem(item)">
          mdi-delete
        </v-icon>
        <v-icon size="default" class="mr-2" @click="showInvoiceItems(item)">
          mdi-format-list-bulleted
        </v-icon>
        <v-icon size="default" class="mr-2" @click="viewInvoice(item)">
          mdi-eye
        </v-icon>
        <v-icon size="default" @click="handleExportPdf(item)">
          mdi-file-pdf-box
        </v-icon>
        <v-icon v-if="authStore.isAdmin" size="default" class="ml-2" @click="handleSendInvoice(item)">
          mdi-email-fast-outline
        </v-icon>
      </template>

    </v-data-table>

    <InvoiceForm
      v-model="dialog"
      :edited-item="editedItem"
      :form-title="formTitle"
      @close="close"
      @save="save"
      @mark-sent="handleMarkAsSent"
    />

    <!-- Invoice Items Dialog -->
    <v-dialog v-model="itemsDialog" max-width="800" :fullscreen="smAndDown" @click:outside="closeItemsDialog">
      <v-card>
        <v-card-title>
          <span class="text-h5">Items for Invoice #{{ selectedInvoiceNumber }}</span>
        </v-card-title>

        <v-card-text>
          <v-data-table
            :headers="itemHeaders"
            :items="currentInvoiceItems"
            density="compact"
          >
            <template v-slot:item.price_per_unit="{ item }">
              {{ formatCurrency(item.price_per_unit) }}
            </template>

            <template v-slot:item.amount="{ item }">
              {{ item.amount != null ? formatCurrency(item.amount) : '' }}
            </template>

            <template v-slot:item.date_of_service="{ item }">
              {{ item.date_of_service ? formatDate(item.date_of_service) : '' }}
            </template>

            <template v-slot:item.actions="{ item }">
              <v-icon size="default" class="mr-2" @click="editInvoiceItem(item)">
                mdi-pencil
              </v-icon>
              <v-icon size="default" @click="deleteInvoiceItem(item)">
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>

          <v-divider class="my-4" />

          <v-container>
            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="editedInvoiceItem.description"
                  :items="templateNames"
                  label="Description"
                  :rules="[v => !!v || 'Description is required']"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="editedInvoiceItem.quantity"
                  label="Quantity"
                  type="number"
                  :rules="[v => !!v || 'Quantity is required']"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="editedInvoiceItem.price_per_unit"
                  label="Price per Unit"
                  type="number"
                  :rules="[v => !!v || 'Price per unit is required']"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="editedInvoiceItem.date_of_service"
                  label="Date of Service"
                  type="date"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-btn color="primary" @click="saveInvoiceItem">
                  {{ invoiceItemFormTitle }}
                </v-btn>
                <v-btn v-if="editedInvoiceItemId !== -1" color="grey" variant="text" @click="cancelEditInvoiceItem" class="ml-2">
                  Cancel
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="blue-darken-1" variant="text" @click="closeItemsDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <InvoicePreview
      v-model="viewDialog"
      :invoice="viewInvoiceData"
      :customer="viewCustomerData"
      :invoice-items="viewInvoiceItems"
    />

    <SendInvoiceDialog
      v-model="sendDialog"
      :invoice="sendInvoiceData"
      :customer="sendCustomerData"
      :invoice-items="sendInvoiceItems"
      :contacts="sendContacts"
      :loading="sendingEmail"
      @confirm="confirmSendInvoice"
    />

    <ConfirmDialog />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { invoiceService } from '@/services/invoice.service'
import { invoiceItemService } from '@/services/invoiceItem.service'
import { customerService } from '@/services/customer.service'
import { invoiceItemTemplateService } from '@/services/invoiceItemTemplate.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useSnackbarStore } from '@/stores/snackbar'
import InvoiceForm from '@/components/InvoiceForm.vue'
import InvoicePreview from '@/components/InvoicePreview.vue'
import SendInvoiceDialog from '@/components/SendInvoiceDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { customerContactService } from '@/services/customerContact.service'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { exportInvoicePdf, generateInvoicePdfBlob } from '@/utils/invoicePdf'
import type { Invoice, InvoiceItem, Customer, InvoiceItemTemplate, CustomerContact } from '@/types/models'
import essoCoffeeLogo from '@/assets/esso-coffee-logo.png'

const { confirm } = useConfirmDialog()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()
const { smAndDown } = useDisplay()

const search = ref('')
const dialog = ref(false)
const loading = ref(false)
const hidePaid = ref(false)
const hideOldInvoices = ref(false)
const itemsDialog = ref(false)
const viewDialog = ref(false)
const viewInvoiceData = ref<Invoice | null>(null)
const viewCustomerData = ref<Customer | null>(null)
const viewInvoiceItems = ref<InvoiceItem[]>([])
const sendDialog = ref(false)
const sendInvoiceData = ref<Invoice | null>(null)
const sendCustomerData = ref<Customer | null>(null)
const sendInvoiceItems = ref<InvoiceItem[]>([])
const sendContacts = ref<CustomerContact[]>([])
const sendingEmail = ref(false)

const invoiceData = ref<Invoice[]>([])
const customerData = ref<Customer[]>([])
const allInvoiceItems = ref<InvoiceItem[]>([])
const invoiceItemTemplates = ref<InvoiceItemTemplate[]>([])
const templateNames = computed(() => invoiceItemTemplates.value.map(t => t.name))

const editedId = ref(-1)
const selectedInvoiceId = ref(-1)
const selectedInvoiceNumber = ref(0)
const editedInvoiceItemId = ref(-1)

const defaultItem: Partial<Invoice> = {
  invoice_number: 0,
  customer_id: undefined,
  date: '',
  paid: false,
}

function getDefaultInvoiceItem(): Partial<InvoiceItem> {
  return {
    description: '',
    quantity: 0,
    price_per_unit: 0,
    date_of_service: todayISO(),
  }
}

const editedItem = ref<Partial<Invoice>>({ ...defaultItem })
const editedInvoiceItem = ref<Partial<InvoiceItem>>(getDefaultInvoiceItem())

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Invoice #', key: 'invoice_number' },
  { title: 'Date', key: 'date' },
  { title: 'Subtotal', key: 'subtotal' },
  { title: 'Paid', key: 'paid' },
  { title: 'Sent', key: 'sent' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const itemHeaders = [
  { title: 'Description', key: 'description' },
  { title: 'Qty', key: 'quantity' },
  { title: 'Price/Unit', key: 'price_per_unit' },
  { title: 'Amount', key: 'amount' },
  { title: 'Date of Service', key: 'date_of_service' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const formTitle = computed(() => {
  return editedId.value === -1 ? 'New Invoice' : 'Edit Invoice'
})

const invoiceItemFormTitle = computed(() => {
  return editedInvoiceItemId.value === -1 ? 'Add Item' : 'Update Item'
})

const items = computed(() => {
  if (invoiceData.value && customerData.value) {
    let filtered = invoiceData.value.map((invoice) => {
      const customer = customerData.value.find((c) => c.id === invoice.customer_id)
      return {
        ...invoice,
        customer: customer?.name ?? '',
      }
    })

    // Filter out paid invoices if hidePaid is enabled
    if (hidePaid.value) {
      filtered = filtered.filter(invoice => !invoice.paid)
    }

    // Filter out invoices older than one month if hideOldInvoices is enabled
    if (hideOldInvoices.value) {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      filtered = filtered.filter(invoice => {
        if (!invoice.date) return true
        const invoiceDate = new Date(invoice.date)
        return invoiceDate >= oneMonthAgo
      })
    }

    return filtered
  }
  return []
})

const currentInvoiceItems = computed(() => {
  return allInvoiceItems.value
    .filter(item => item.invoice_id === selectedInvoiceId.value)
    .sort((a, b) => {
      if (!a.date_of_service) return 1
      if (!b.date_of_service) return -1
      return a.date_of_service.localeCompare(b.date_of_service)
    })
})

const totalUnpaid = computed(() => {
  return items.value
    .filter(invoice => !invoice.paid)
    .reduce((sum, invoice) => sum + (invoice.subtotal ?? 0), 0)
})

function getCustomerUnpaidTotal(customerName: string): number {
  return items.value
    .filter(invoice => invoice.customer === customerName && !invoice.paid)
    .reduce((sum, invoice) => sum + (invoice.subtotal ?? 0), 0)
}

async function loadInvoices() {
  invoiceData.value = await invoiceService.getAll()
}

async function loadData() {
  loading.value = true
  try {
    const [invoices, customers, invoiceItems, fetchedTemplates] = await Promise.all([
      invoiceService.getAll(),
      customerService.getAll(),
      invoiceItemService.getAll(),
      invoiceItemTemplateService.getAll(),
    ])
    invoiceData.value = invoices
    customerData.value = customers
    allInvoiceItems.value = invoiceItems
    invoiceItemTemplates.value = fetchedTemplates
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load invoice data'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function nextInvoiceNumber(): number {
  const max = invoiceData.value.reduce((m, inv) => Math.max(m, inv.invoice_number), 0)
  return max + 1
}

function openNew() {
  editedId.value = -1
  editedItem.value = {
    invoice_number: nextInvoiceNumber(),
    customer_id: undefined,
    date: todayISO(),
    paid: false,
  }
  dialog.value = true
}

function editItem(item: Invoice) {
  editedId.value = item.id
  editedItem.value = { ...item }
  dialog.value = true
}

async function deleteItem(invoice: Invoice) {
  const confirmed = await confirm('Delete Invoice #' + invoice.invoice_number + '?', {
    icon: 'mdi-alert',
  })
  if (confirmed) {
    try {
      await invoiceService.delete(invoice.id)
      await loadInvoices()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete invoice'
      snackbarStore.showSnackbar({ text: message, color: 'error' })
    }
  }
}

async function handleExportPdf(item: Invoice) {
  const customer = customerData.value.find((c) => c.id === item.customer_id)
  const lineItems = allInvoiceItems.value
    .filter((i) => i.invoice_id === item.id)
    .sort((a, b) => {
      if (!a.date_of_service) return 1
      if (!b.date_of_service) return -1
      return a.date_of_service.localeCompare(b.date_of_service)
    })
  try {
    await exportInvoicePdf(item, customer, lineItems, essoCoffeeLogo)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export PDF'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  }
}

function viewInvoice(item: Invoice) {
  viewInvoiceData.value = item
  viewCustomerData.value = customerData.value.find((c) => c.id === item.customer_id) ?? null
  viewInvoiceItems.value = allInvoiceItems.value
    .filter((i) => i.invoice_id === item.id)
    .sort((a, b) => {
      if (!a.date_of_service) return 1
      if (!b.date_of_service) return -1
      return a.date_of_service.localeCompare(b.date_of_service)
    })
  viewDialog.value = true
}

function showInvoiceItems(item: Invoice) {
  selectedInvoiceId.value = item.id
  selectedInvoiceNumber.value = item.invoice_number
  itemsDialog.value = true
}

function close() {
  dialog.value = false
  editedId.value = -1
  editedItem.value = { ...defaultItem }
}

function closeItemsDialog() {
  itemsDialog.value = false
  selectedInvoiceId.value = -1
  selectedInvoiceNumber.value = 0
  editedInvoiceItemId.value = -1
  editedInvoiceItem.value = getDefaultInvoiceItem()
}

async function save(payload: Partial<Invoice>) {
  try {
    if (editedId.value > -1) {
      await invoiceService.update(editedId.value, {
        invoice_number: payload.invoice_number,
        customer_id: payload.customer_id,
        date: payload.date,
        paid: payload.paid,
      })
      close()
      await loadData()
    } else {
      const newInvoice = await invoiceService.create({
        invoice_number: payload.invoice_number,
        customer_id: payload.customer_id,
        date: payload.date,
        paid: payload.paid,
      })
      const invoiceId = newInvoice.id
      close()
      await loadData()
      // Wait for dialog to close before opening items dialog
      await nextTick()
      // Find the newly created invoice from the loaded data
      const createdInvoice = invoiceData.value.find(inv => inv.id === invoiceId)
      if (createdInvoice) {
        // Automatically open invoice items dialog for the newly created invoice
        selectedInvoiceId.value = createdInvoice.id
        selectedInvoiceNumber.value = createdInvoice.invoice_number
        itemsDialog.value = true
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save invoice'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  }
}

function editInvoiceItem(item: InvoiceItem) {
  editedInvoiceItemId.value = item.id
  editedInvoiceItem.value = { ...item }
}

function cancelEditInvoiceItem() {
  editedInvoiceItemId.value = -1
  editedInvoiceItem.value = getDefaultInvoiceItem()
}

async function deleteInvoiceItem(item: InvoiceItem) {
  const confirmed = await confirm('Delete invoice item: ' + item.description + '?', {
    icon: 'mdi-alert',
  })
  if (confirmed) {
    try {
      await invoiceItemService.delete(item.id)
      const [invoices, invoiceItems] = await Promise.all([
        invoiceService.getAll(),
        invoiceItemService.getAll(),
      ])
      invoiceData.value = invoices
      allInvoiceItems.value = invoiceItems
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete invoice item'
      snackbarStore.showSnackbar({ text: message, color: 'error' })
    }
  }
}

async function saveInvoiceItem() {
  try {
    if (editedInvoiceItemId.value > -1) {
      await invoiceItemService.update(editedInvoiceItemId.value, {
        invoice_id: selectedInvoiceId.value,
        description: editedInvoiceItem.value.description,
        quantity: editedInvoiceItem.value.quantity,
        price_per_unit: editedInvoiceItem.value.price_per_unit,
        date_of_service: editedInvoiceItem.value.date_of_service,
      })
    } else {
      await invoiceItemService.create({
        invoice_id: selectedInvoiceId.value,
        description: editedInvoiceItem.value.description,
        quantity: editedInvoiceItem.value.quantity,
        price_per_unit: editedInvoiceItem.value.price_per_unit,
        date_of_service: editedInvoiceItem.value.date_of_service,
      })
    }
    editedInvoiceItemId.value = -1
    editedInvoiceItem.value = getDefaultInvoiceItem()

    const [invoices, invoiceItems] = await Promise.all([
      invoiceService.getAll(),
      invoiceItemService.getAll(),
    ])
    invoiceData.value = invoices
    allInvoiceItems.value = invoiceItems
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save invoice item'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  }
}

async function handleSendInvoice(item: Invoice) {
  const customer = customerData.value.find(c => c.id === item.customer_id)
  if (!customer) {
    snackbarStore.showSnackbar({ text: 'Customer not found', color: 'error' })
    return
  }
  try {
    const contacts = await customerContactService.getAll(customer.id)
    sendContacts.value = contacts
  } catch {
    sendContacts.value = []
  }
  sendInvoiceData.value = item
  sendCustomerData.value = customer
  sendInvoiceItems.value = allInvoiceItems.value
    .filter(i => i.invoice_id === item.id)
    .sort((a, b) => {
      if (!a.date_of_service) return 1
      if (!b.date_of_service) return -1
      return a.date_of_service.localeCompare(b.date_of_service)
    })
  sendDialog.value = true
}

async function confirmSendInvoice() {
  if (!sendInvoiceData.value || !sendCustomerData.value) return
  sendingEmail.value = true
  try {
    const pdfBlob = await generateInvoicePdfBlob(
      sendInvoiceData.value,
      sendCustomerData.value,
      sendInvoiceItems.value,
      essoCoffeeLogo,
    )
    const filename = `invoice_${sendInvoiceData.value.invoice_number}.pdf`
    await invoiceService.sendEmail(sendInvoiceData.value.id, pdfBlob, filename)
    await new Promise(resolve => setTimeout(resolve, 500))
    await loadInvoices()
    snackbarStore.showSnackbar({ text: 'Invoice email sent', color: 'success' })
    sendDialog.value = false
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send invoice email'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  } finally {
    sendingEmail.value = false
  }
}

async function handleMarkAsSent() {
  if (editedId.value === -1) return
  try {
    await invoiceService.markAsSent(editedId.value)
    close()
    await loadData()
    snackbarStore.showSnackbar({ text: 'Invoice marked as sent', color: 'success' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark invoice as sent'
    snackbarStore.showSnackbar({ text: message, color: 'error' })
  }
}

watch(() => editedInvoiceItem.value.description, (newDesc) => {
  const template = invoiceItemTemplates.value.find(t => t.name === newDesc)
  if (template && template.price_per_unit != null) {
    editedInvoiceItem.value.price_per_unit = template.price_per_unit
  }
})

onMounted(() => {
  loadData()
})
</script>
