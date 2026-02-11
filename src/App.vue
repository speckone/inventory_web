<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list density="compact" nav>
        <v-list-item
          v-for="(item, i) in sidebar"
          :key="i"
          :prepend-icon="item.avatar"
          :title="item.title"
          @click="visitRoute(item.router)"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="indigo" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>{{ title }}</v-toolbar-title>
      <v-spacer />
      <v-menu v-if="authStore.loggedIn">
        <template #activator="{ props }">
          <v-avatar color="indigo" v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-avatar>
          <span class="ml-2">{{ authStore.userName }}</span>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppSnackbar from '@/components/AppSnackbar.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const authStore = useAuthStore()

const drawer = ref(false)
const title = 'Esso Inventory'

const allSidebarItems = [
  { title: 'Inventory', avatar: 'mdi-home', router: '/' },
  { title: 'Orders', avatar: 'mdi-cart-arrow-down', router: '/orders' },
  { title: 'Order History', avatar: 'mdi-history', router: '/order_history' },
  { title: 'Products', avatar: 'mdi-archive-arrow-down', router: '/products' },
  { title: 'Categories', avatar: 'mdi-view-list', router: '/category' },
  { title: 'Vendors', avatar: 'mdi-store', router: '/vendors' },
  { title: 'Units', avatar: 'mdi-beaker', router: '/units' },
  { title: 'Customers', avatar: 'mdi-account-group', router: '/customers', adminOnly: true },
  { title: 'Invoices', avatar: 'mdi-receipt-text', router: '/invoices', adminOnly: true },
  { title: 'About', avatar: 'mdi-information', router: '/about' },
]

const sidebar = computed(() => {
  return allSidebarItems.filter(item => {
    // Show all items to admin users
    if (authStore.isAdmin) return true
    // For non-admin users, hide admin-only items
    return !item.adminOnly
  })
})

function visitRoute(route: string) {
  router.push(route)
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
