import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

  const routes = [
  {
    path: '/',
    name: 'Inventory',
    component: () => import('../views/Inventory.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/Order.vue')
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/Product.vue')
  },
  {
    path: '/vendors',
    name: 'Vendors',
    component: () => import('../views/Vendor.vue')
  },
  {
    path: '/category',
    name: 'Categories',
    component: () => import('../views/Category.vue')
  },
  {
    path: '/units',
    name: 'Units',
    component: () => import('../views/Unit.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue')
  },
]

const router = new VueRouter({
  routes
})

router.beforeEach((to, from, next) => {
  // redirect to login page if not logged in and trying to access a restricted page
  const publicPages = ['/login'];
  const authRequired = !publicPages.includes(to.path);
  const loggedIn = localStorage.getItem('user');
  if (authRequired && !loggedIn) {
    return next('/login');
  }

  next();
})

export default router
