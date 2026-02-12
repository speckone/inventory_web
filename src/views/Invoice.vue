<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="items"
      :search="search"
      :group-by="[{ key: 'customer' }]"
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
        <v-toolbar flat color="white">
          <v-toolbar-title>Invoices</v-toolbar-title>
          <v-divider class="mx-4" inset vertical />
          <v-spacer />
          <v-text-field
            v-model="search"
            append-inner-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            density="compact"
            class="mr-4"
            style="max-width: 250px;"
          />
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

      <template v-slot:item.actions="{ item }">
        <v-icon size="small" class="mr-2" @click="editItem(item)">
          mdi-pencil
        </v-icon>
        <v-icon size="small" class="mr-2" @click="deleteItem(item)">
          mdi-delete
        </v-icon>
        <v-icon size="small" class="mr-2" @click="showInvoiceItems(item)">
          mdi-format-list-bulleted
        </v-icon>
        <v-icon size="small" class="mr-2" @click="viewInvoice(item)">
          mdi-eye
        </v-icon>
        <v-icon size="small" @click="exportInvoicePdf(item)">
          mdi-file-pdf-box
        </v-icon>
      </template>

    </v-data-table>

    <v-dialog v-model="dialog" max-width="500" @click:outside="close">
      <v-card>
              <v-card-title>
                <span class="text-h5">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model.number="editedItem.invoice_number"
                        label="Invoice Number"
                        type="number"
                        :rules="[v => !!v || 'Invoice number is required']"
                      />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <EntitySelect
                        v-model="editedItem.customer_id"
                        label="Customer"
                        :load-items="customerService.getAll"
                      />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedItem.date"
                        label="Date"
                        type="date"
                      />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-checkbox
                        v-model="editedItem.paid"
                        label="Paid"
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
            </v-card>
    </v-dialog>

    <!-- Invoice Items Dialog -->
    <v-dialog v-model="itemsDialog" max-width="800" @click:outside="closeItemsDialog">
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
              <v-icon size="small" class="mr-2" @click="editInvoiceItem(item)">
                mdi-pencil
              </v-icon>
              <v-icon size="small" @click="deleteInvoiceItem(item)">
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>

          <v-divider class="my-4" />

          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedInvoiceItem.description"
                  label="Description"
                  :rules="[v => !!v || 'Description is required']"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="4">
                <v-text-field
                  v-model.number="editedInvoiceItem.quantity"
                  label="Quantity"
                  type="number"
                  :rules="[v => !!v || 'Quantity is required']"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="editedInvoiceItem.price_per_unit"
                  label="Price per Unit"
                  type="number"
                  :rules="[v => !!v || 'Price per unit is required']"
                />
              </v-col>
              <v-col cols="4">
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

    <!-- View Invoice Dialog -->
    <v-dialog v-model="viewDialog" max-width="800">
      <v-card v-if="viewInvoiceData" class="pa-6">
        <!-- Header -->
        <div class="d-flex justify-space-between mb-6">
          <div>
            <img :src="essoCoffeeLogo" alt="Esso Coffee" style="height: 40px;" class="mb-2" />
            <div class="text-body-2">4700 N 12th St #107</div>
            <div class="text-body-2">Phoenix, AZ 85014</div>
            <div class="text-body-2">Phone: 480.560.3067</div>
          </div>
          <div class="text-right">
            <div class="text-h6">INVOICE # {{ viewInvoiceData.invoice_number }}</div>
            <v-chip :color="viewInvoiceData.paid ? 'success' : 'warning'" size="small" variant="flat" class="mt-2">
              {{ viewInvoiceData.paid ? 'Paid' : 'Unpaid' }}
            </v-chip>
          </div>
        </div>

        <!-- Bill To -->
        <div class="mb-6">
          <span class="font-weight-bold font-italic">BILL TO:</span>
          <span class="ml-4">{{ viewCustomerData?.name }}</span>
          <div v-if="viewCustomerData?.address" class="ml-16 text-body-2">{{ viewCustomerData.address }}</div>
          <div v-if="viewCustomerData?.city || viewCustomerData?.state || viewCustomerData?.zip_code" class="ml-16 text-body-2">
            {{ [viewCustomerData?.city, viewCustomerData?.state].filter(Boolean).join(', ') }}
            {{ viewCustomerData?.zip_code }}
          </div>
        </div>

        <!-- Line Items Table -->
        <v-table density="compact">
          <thead>
            <tr class="bg-blue-lighten-4">
              <th class="font-weight-bold font-italic">DATE OF SERVICE</th>
              <th class="font-weight-bold font-italic">DESCRIPTION</th>
              <th class="font-weight-bold font-italic text-right">PRICE</th>
              <th class="font-weight-bold font-italic text-right">QUANTITY</th>
              <th class="font-weight-bold font-italic text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lineItem in viewInvoiceItems" :key="lineItem.id">
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
            <span class="font-weight-bold text-right" style="width: 120px;">{{ viewInvoiceData.subtotal != null ? formatCurrency(viewInvoiceData.subtotal) : '$0.00' }}</span>
          </div>
        </div>

        <v-card-actions class="mt-4">
          <v-spacer />
          <v-btn color="blue-darken-1" variant="text" @click="viewDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { invoiceService } from '@/services/invoice.service'
import { invoiceItemService } from '@/services/invoiceItem.service'
import { customerService } from '@/services/customer.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import EntitySelect from '@/components/EntitySelect.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Invoice, InvoiceItem, Customer } from '@/types/models'
import essoCoffeeLogo from '@/assets/esso-coffee-logo.png'

const { confirm } = useConfirmDialog()

const search = ref('')
const dialog = ref(false)
const hidePaid = ref(false)
const hideOldInvoices = ref(false)
const itemsDialog = ref(false)
const viewDialog = ref(false)
const viewInvoiceData = ref<Invoice | null>(null)
const viewCustomerData = ref<Customer | null>(null)
const viewInvoiceItems = ref<InvoiceItem[]>([])

const invoiceData = ref<Invoice[]>([])
const customerData = ref<Customer[]>([])
const allInvoiceItems = ref<InvoiceItem[]>([])

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

const defaultInvoiceItem: Partial<InvoiceItem> = {
  description: '',
  quantity: 0,
  price_per_unit: 0,
  date_of_service: '',
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
  return allInvoiceItems.value.filter(item => item.invoice_id === selectedInvoiceId.value)
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
  const [invoices, customers, invoiceItems] = await Promise.all([
    invoiceService.getAll(),
    customerService.getAll(),
    invoiceItemService.getAll(),
  ])
  invoiceData.value = invoices
  customerData.value = customers
  allInvoiceItems.value = invoiceItems
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
    await invoiceService.delete(invoice.id)
    await loadInvoices()
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function exportInvoicePdf(item: Invoice) {
  const customer = customerData.value.find((c) => c.id === item.customer_id)
  const lineItems = allInvoiceItems.value.filter((i) => i.invoice_id === item.id)

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Logo
  let headerBottom = 40
  try {
    const logoImg = await loadImage(essoCoffeeLogo)
    const logoHeight = 14
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight
    doc.addImage(logoImg, 'PNG', 14, 10, logoWidth, logoHeight)
    headerBottom = 28
  } catch {
    // If logo fails to load, fall back to text header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bolditalic')
    doc.text('Esso Coffeehouse', 14, 22)
    headerBottom = 28
  }

  // Business address
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('4700 N 12th St #107', 14, headerBottom)
  doc.text('Phoenix, AZ 85014', 14, headerBottom + 5)
  doc.text('Phone: 480.560.3067', 14, headerBottom + 10)

  // Invoice number
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`INVOICE # ${item.invoice_number}`, pageWidth - 14, 18, { align: 'right' })

  // Bill To
  let billY = headerBottom + 22
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bolditalic')
  doc.text('BILL TO:', 14, billY)
  doc.setFont('helvetica', 'normal')
  if (customer) {
    doc.text(customer.name, 44, billY)
    if (customer.address) {
      billY += 5
      doc.text(customer.address, 44, billY)
    }
    const cityLine = [customer.city, customer.state].filter(Boolean).join(', ')
    const fullLine = [cityLine, customer.zip_code].filter(Boolean).join(' ')
    if (fullLine) {
      billY += 5
      doc.text(fullLine, 44, billY)
    }
  }

  // Line items table
  const tableY = billY + 12
  autoTable(doc, {
    startY: tableY,
    head: [[
      'DATE OF SERVICE',
      'DESCRIPTION',
      'PRICE',
      'QUANTITY',
      'AMOUNT',
    ]],
    body: lineItems.map((li) => [
      li.date_of_service ? formatDate(li.date_of_service) : '',
      li.description,
      formatCurrency(li.price_per_unit),
      String(li.quantity),
      li.amount != null ? formatCurrency(li.amount) : '',
    ]),
    headStyles: {
      fillColor: [187, 212, 238],
      textColor: [0, 0, 0],
      fontStyle: 'bolditalic',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    theme: 'grid',
  })

  // Totals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 10
  const totalsX = pageWidth - 14

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bolditalic')
  doc.text('SUBTOTAL', totalsX - 35, finalY, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(item.subtotal != null ? formatCurrency(item.subtotal) : '$0.00', totalsX, finalY, { align: 'right' })

  doc.line(totalsX - 70, finalY + 3, totalsX, finalY + 3)

  doc.setFont('helvetica', 'bolditalic')
  doc.text('BALANCE', totalsX - 35, finalY + 10, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.text(item.subtotal != null ? formatCurrency(item.subtotal) : '$0.00', totalsX, finalY + 10, { align: 'right' })

  doc.save(`invoice_${item.invoice_number}.pdf`)
}

function viewInvoice(item: Invoice) {
  viewInvoiceData.value = item
  viewCustomerData.value = customerData.value.find((c) => c.id === item.customer_id) ?? null
  viewInvoiceItems.value = allInvoiceItems.value.filter((i) => i.invoice_id === item.id)
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

async function save() {
  const payload = {
    invoice_number: editedItem.value.invoice_number,
    customer_id: editedItem.value.customer_id,
    date: editedItem.value.date,
    paid: editedItem.value.paid,
  }
  if (editedId.value > -1) {
    await invoiceService.update(editedId.value, payload)
    close()
    await loadData()
  } else {
    const newInvoice = await invoiceService.create(payload)
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
    await invoiceItemService.delete(item.id)
    const [invoices, invoiceItems] = await Promise.all([
      invoiceService.getAll(),
      invoiceItemService.getAll(),
    ])
    invoiceData.value = invoices
    allInvoiceItems.value = invoiceItems
  }
}

async function saveInvoiceItem() {
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
}

onMounted(() => {
  loadData()
})
</script>
