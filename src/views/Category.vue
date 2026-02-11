<template>
  <div>
    <v-data-table :headers="headers" :items="items">
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>Categories</v-toolbar-title>
          <v-divider class="mx-4" inset vertical />
          <v-spacer />
        </v-toolbar>
      </template>
      <template #item.actions="{ item }">
        <v-icon size="small" class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon size="small" @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
      <template #bottom>
        <v-toolbar flat>
          <v-spacer />
          <v-dialog v-model="dialog" max-width="500" @click:outside="close">
            <template #activator="{ props }">
              <v-btn color="primary" class="mb-2" v-bind="props">New Category</v-btn>
            </template>
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
        </v-toolbar>
      </template>
    </v-data-table>
    <v-snackbar v-model="snackbar" :timeout="1500" color="success">
      Item updated
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { categoryService } from '@/services/category.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import type { Category } from '@/types/models'

const { confirm } = useConfirmDialog()

const items = ref<Category[]>([])
const dialog = ref(false)
const valid = ref(false)
const snackbar = ref(false)
const currentItemId = ref(-1)
const currentItem = ref<Partial<Category>>({ name: '' })
const formRef = ref()

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const formTitle = computed(() => currentItemId.value === -1 ? 'New Category' : 'Edit Category')

onMounted(() => { loadData() })

async function loadData() {
  items.value = await categoryService.getAll()
}

function editItem(item: Category) {
  currentItem.value = { ...item }
  currentItemId.value = item.id
  dialog.value = true
}

async function deleteItem(item: Category) {
  const confirmed = await confirm(`Delete Category: ${item.name}?`, { icon: 'mdi-alert' })
  if (confirmed) {
    await categoryService.delete(item.id)
    await loadData()
  }
}

function close() {
  dialog.value = false
  formRef.value?.reset()
  currentItemId.value = -1
  currentItem.value = { name: '' }
}

async function save() {
  const { valid: isValid } = await formRef.value?.validate()
  if (isValid) {
    if (currentItemId.value > -1) {
      await categoryService.update(currentItemId.value, { name: currentItem.value.name })
    } else {
      await categoryService.create({ name: currentItem.value.name })
    }
    await loadData()
    snackbar.value = true
    setTimeout(() => close(), 300)
  }
}
</script>
