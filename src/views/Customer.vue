<template>
  <div>
    <v-data-table :headers="headers" :items="items">
      <template #item.actions="{ item }">
        <v-icon size="small" class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon size="small" @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>Customers</v-toolbar-title>
          <v-divider class="mx-4" inset vertical />
          <v-spacer />
          <v-btn color="primary" @click="openNew">New Customer</v-btn>
        </v-toolbar>
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="600" @click:outside="close">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { customerService } from '@/services/customer.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import type { Customer } from '@/types/models'

const { confirm } = useConfirmDialog()

const items = ref<Customer[]>([])
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

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'City', key: 'city' },
  { title: 'State', key: 'state' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const formTitle = computed(() => currentItemId.value === -1 ? 'New Customer' : 'Edit Customer')

onMounted(() => { loadData() })

async function loadData() {
  items.value = await customerService.getAll()
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
    await loadData()
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
    await loadData()
    snackbar.value = true
    setTimeout(() => close(), 300)
  }
}
</script>
