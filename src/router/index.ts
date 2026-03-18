import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue'),
    },
    {
      path: '/inventory',
      name: 'Inventory',
      component: () => import('@/views/Inventory.vue'),
    },
    {
      path: '/orders',
      name: 'Orders',
      component: () => import('@/views/Order.vue'),
    },
    {
      path: '/order_history',
      name: 'Order History',
      component: () => import('@/views/OrderHistory.vue'),
    },
    {
      path: '/products',
      name: 'Products',
      component: () => import('@/views/Product.vue'),
    },
    {
      path: '/vendors',
      name: 'Vendors',
      component: () => import('@/views/Vendor.vue'),
    },
    {
      path: '/category',
      name: 'Categories',
      component: () => import('@/views/Category.vue'),
    },
    {
      path: '/units',
      name: 'Units',
      component: () => import('@/views/Unit.vue'),
    },
    {
      path: '/invoice-item-templates',
      name: 'Invoice Item Templates',
      component: () => import('@/views/InvoiceItemTemplate.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/customers',
      name: 'Customers',
      component: () => import('@/views/Customer.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/invoices',
      name: 'Invoices',
      component: () => import('@/views/Invoice.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/email-settings',
      name: 'Email Settings',
      component: () => import('@/views/EmailSettings.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/settings/telegram',
      name: 'TelegramSettings',
      component: () => import('@/views/TelegramSettings.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/users',
      name: 'Users',
      component: () => import('@/views/UserManagement.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/views/About.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginPage.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)
  const userStr = localStorage.getItem('user')

  if (authRequired && !userStr) {
    return '/login'
  }

  // Check admin-only routes
  if (to.meta.requiresAdmin && userStr) {
    try {
      const user = (JSON.parse(userStr)).user
      if (!user || user.role !== 'admin') {
        // Redirect non-admin users to the dashboard
        return '/dashboard'
      }
    } catch {
      localStorage.removeItem('user')
      return '/login'
    }
  }
})

export default router
