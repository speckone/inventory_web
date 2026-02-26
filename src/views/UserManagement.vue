<template>
  <v-card class="ma-4">
    <v-data-table-server
      :headers="headers"
      :items="paginatedUsers"
      :items-length="totalUsers"
      :loading="usersLoading"
      :items-per-page-options="[10, 25, 50, { value: -1, title: 'All' }]"
      @update:options="onOptionsUpdate"
    >
      <template #item.role="{ item }">
        <v-chip :color="item.role === 'admin' ? 'primary' : 'default'" size="small" variant="flat">
          {{ item.role }}
        </v-chip>
      </template>
      <template #item.active="{ item }">
        <v-chip :color="item.active ? 'success' : 'error'" size="small" variant="flat">
          {{ item.active ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-icon size="default" class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon size="default" @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>Users</v-toolbar-title>
          <v-divider class="mx-4" inset vertical />
          <v-spacer />
          <v-btn color="primary" @click="openNew">New User</v-btn>
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
                    v-model="currentItem.username"
                    label="Username"
                    :rules="[v => !!v || 'Username is required']"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="currentItem.name"
                    label="Name"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="currentItem.email"
                    label="Email"
                    :rules="[v => !!v || 'Email is required']"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="password"
                    label="Password"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    :rules="passwordRules"
                    :hint="isEditing ? 'Leave blank to keep current password' : ''"
                    :persistent-hint="isEditing"
                    @click:append-inner="showPassword = !showPassword"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="currentItem.role"
                    label="Role"
                    :items="['admin', 'user']"
                    :rules="[v => !!v || 'Role is required']"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="currentItem.active"
                    label="Active"
                    color="success"
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
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { userService } from '@/services/user.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { usePagination } from '@/composables/usePagination'
import { useSnackbarStore } from '@/stores/snackbar'
import type { ManagedUser } from '@/types/models'

const { smAndDown, mdAndDown } = useDisplay()
const { confirm } = useConfirmDialog()
const snackbarStore = useSnackbarStore()

const {
  items: paginatedUsers,
  totalItems: totalUsers,
  loading: usersLoading,
  onOptionsUpdate,
  refresh: refreshUsers,
} = usePagination<ManagedUser>((page, perPage) => userService.getPage({ page, perPage }))

const dialog = ref(false)
const valid = ref(false)
const currentItemId = ref(-1)
const currentItem = ref<Partial<ManagedUser>>({
  username: '',
  name: '',
  email: '',
  role: 'user',
  active: true,
})
const password = ref('')
const showPassword = ref(false)
const formRef = ref()

const isEditing = computed(() => currentItemId.value > -1)

const passwordRules = computed(() => {
  if (isEditing.value) return []
  return [(v: string) => !!v || 'Password is required']
})

const allHeaders = [
  { title: 'ID', key: 'id' },
  { title: 'Username', key: 'username' },
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Active', key: 'active' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const headers = computed(() => {
  if (mdAndDown.value) {
    return allHeaders.filter(h => h.key !== 'id' && h.key !== 'email')
  }
  return allHeaders
})

const formTitle = computed(() => isEditing.value ? 'Edit User' : 'New User')

function openNew() {
  currentItemId.value = -1
  currentItem.value = { username: '', name: '', email: '', role: 'user', active: true }
  password.value = ''
  showPassword.value = false
  dialog.value = true
}

function editItem(item: ManagedUser) {
  currentItem.value = { ...item }
  currentItemId.value = item.id
  password.value = ''
  showPassword.value = false
  dialog.value = true
}

async function deleteItem(item: ManagedUser) {
  const confirmed = await confirm(`Delete user: ${item.username}?`, { icon: 'mdi-alert' })
  if (confirmed) {
    await userService.delete(item.id)
    snackbarStore.showSnackbar({ text: 'User deleted', color: 'success' })
    refreshUsers()
  }
}

function close() {
  dialog.value = false
  formRef.value?.reset()
  currentItemId.value = -1
  currentItem.value = { username: '', name: '', email: '', role: 'user', active: true }
  password.value = ''
  showPassword.value = false
}

async function save() {
  const { valid: isValid } = await formRef.value?.validate()
  if (isValid) {
    const payload: Record<string, unknown> = {
      username: currentItem.value.username,
      name: currentItem.value.name || null,
      email: currentItem.value.email,
      role: currentItem.value.role,
      active: currentItem.value.active,
    }
    if (password.value) {
      payload.password = password.value
    }
    if (isEditing.value) {
      await userService.update(currentItemId.value, payload as Partial<ManagedUser> & { password?: string })
      snackbarStore.showSnackbar({ text: 'User updated', color: 'success' })
    } else {
      await userService.create(payload as Partial<ManagedUser> & { password: string })
      snackbarStore.showSnackbar({ text: 'User created', color: 'success' })
    }
    refreshUsers()
    setTimeout(() => close(), 300)
  }
}
</script>
