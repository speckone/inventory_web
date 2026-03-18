<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <div class="d-flex align-center justify-center pa-4">
        <img
          src="@/assets/esso-coffee-logo.png"
          alt="Esso Coffee"
          style="max-width: 140px; max-height: 80px;"
        />
      </div>

      <v-divider />

      <!-- Main Section -->
      <v-list density="compact" nav>
        <v-list-subheader>Main</v-list-subheader>
        <v-list-item
          v-for="item in mainItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :value="item.title"
          @click="visitRoute(item.route)"
        />
      </v-list>

      <!-- Admin Section (admin only) -->
      <template v-if="authStore.isAdmin">
        <v-divider />
        <v-list density="compact" nav>
          <v-list-subheader>Admin</v-list-subheader>
          <v-list-item
            v-for="item in adminItems"
            :key="item.title"
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.title"
            @click="visitRoute(item.route)"
          />
        </v-list>
      </template>

      <!-- Settings Section (admin only) -->
      <template v-if="authStore.isAdmin">
        <v-divider />
        <v-list density="compact" nav>
          <v-list-subheader>Settings</v-list-subheader>
          <v-list-item
            v-for="item in settingsItems"
            :key="item.title"
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.title"
            @click="visitRoute(item.route)"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="primary">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>{{ title }}</v-toolbar-title>
      <v-spacer />
      <v-menu v-if="authStore.loggedIn">
        <template #activator="{ props }">
          <v-avatar color="primary-darken-1" v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-avatar>
          <span class="ml-2 text-white">{{ authStore.userName }}</span>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <template #append>
              <v-icon>mdi-export</v-icon>
            </template>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <router-view class="pt-5" />
    </v-main>

    <AppSnackbar />
    <ConfirmDialog />
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppSnackbar from '@/components/AppSnackbar.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const authStore = useAuthStore()

const drawer = ref(false)
const title = 'Esso Inventory'

const mainItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', route: '/dashboard' },
  { title: 'Inventory', icon: 'mdi-clipboard-list', route: '/inventory' },
  { title: 'Orders', icon: 'mdi-cart', route: '/orders' },
  { title: 'Order History', icon: 'mdi-history', route: '/order_history' },
  { title: 'Products', icon: 'mdi-coffee', route: '/products' },
]

const adminItems = [
  { title: 'Customers', icon: 'mdi-account-group', route: '/customers' },
  { title: 'Invoices', icon: 'mdi-receipt-text', route: '/invoices' },
]

const settingsItems = [
  { title: 'Categories', icon: 'mdi-tag', route: '/category' },
  { title: 'Vendors', icon: 'mdi-store', route: '/vendors' },
  { title: 'Units', icon: 'mdi-scale', route: '/units' },
  { title: 'Item Templates', icon: 'mdi-text-box-outline', route: '/invoice-item-templates' },
  { title: 'Email', icon: 'mdi-email-outline', route: '/email-settings' },
  { title: 'Telegram', icon: 'mdi-robot', route: '/settings/telegram' },
  { title: 'Users', icon: 'mdi-account-cog', route: '/users' },
]

function visitRoute(route: string) {
  router.push(route)
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
