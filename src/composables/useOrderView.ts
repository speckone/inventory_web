import { ref, computed } from 'vue'
import { productService } from '@/services/product.service'
import { unitService } from '@/services/unit.service'
import { orderService } from '@/services/order.service'
import { orderItemService } from '@/services/orderItem.service'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useSnackbarStore } from '@/stores/snackbar'
import type { Product, Unit, Order, OrderItem } from '@/types/models'

export function useOrderView(status: string) {
  const { confirm } = useConfirmDialog()
  const snackbarStore = useSnackbarStore()

  const productData = ref<Product[]>([])
  const orderData = ref<Order[]>([])
  const orderItemData = ref<OrderItem[]>([])
  const unitData = ref<Unit[]>([])
  const loading = ref(false)

  const headers = [
    { title: 'ID', key: 'id' },
    { title: 'Quantity', key: 'quantity' },
    { title: 'Product', key: 'product' },
    { title: 'Actions', key: 'actions', sortable: false },
  ]

  const items = computed(() => {
    if (orderData.value && orderItemData.value && productData.value && unitData.value) {
      const openOrderIds = orderData.value.map((order) => order.id)
      return orderItemData.value
        .map((orderItem) => {
          const orderProduct = productData.value.find((p) => p.id === orderItem.product_id)
          const productUnit = orderProduct
            ? unitData.value.find((u) => u.id === orderProduct.unit_id)
            : undefined
          return {
            ...orderItem,
            product: orderProduct?.name ?? '',
            unit: productUnit?.name ?? '',
          }
        })
        .filter((orderItem) => openOrderIds.includes(orderItem.order_id))
    }
    return []
  })

  function getOrderDate(orderId: number): string {
    const order = orderData.value.find((o) => o.id === orderId)
    return order ? new Date(order.date).toLocaleString() : ''
  }

  function getOrderStatus(orderId: number): string {
    const order = orderData.value.find((o) => o.id === orderId)
    return order?.status ?? ''
  }

  function getOrderCost(orderId: number): number {
    const order = orderData.value.find((o) => o.id === orderId)
    return order?.cost ?? 0
  }

  function isNew(orderId: number): boolean {
    const order = orderData.value.find((o) => o.id === orderId)
    return order?.status === 'New'
  }

  function isSubmitted(orderId: number): boolean {
    const order = orderData.value.find((o) => o.id === orderId)
    return order?.status === 'Submitted'
  }

  async function loadOrders() {
    orderData.value = await orderService.getByStatus(status)
  }

  async function loadOrderItems() {
    orderItemData.value = await orderItemService.getAll()
  }

  async function loadData() {
    loading.value = true
    try {
      const [orders, products, orderItems, units] = await Promise.all([
        orderService.getByStatus(status),
        productService.getAll(),
        orderItemService.getAll(),
        unitService.getAll(),
      ])
      orderData.value = orders
      productData.value = products
      orderItemData.value = orderItems
      unitData.value = units
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load order data'
      snackbarStore.showSnackbar({ text: message, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function submitOrder(orderId: number) {
    const confirmed = await confirm('Send order to Sharon?', {
      icon: 'mdi-alert',
      buttonTrueText: 'Yes! Send my order.',
    })
    if (confirmed) {
      try {
        await orderService.updateStatus(orderId, 'Submitted')
        await loadOrders()
        snackbarStore.showSnackbar({
          show: true,
          text: 'Order submitted',
          color: 'success',
          timeout: 2000,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to submit order'
        snackbarStore.showSnackbar({ text: message, color: 'error' })
      }
    }
  }

  async function receiveOrder(orderId: number) {
    try {
      await orderService.updateStatus(orderId, 'Received')
      await loadOrders()
      snackbarStore.showSnackbar({
        show: true,
        text: 'Order received',
        color: 'success',
        timeout: 2000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to receive order'
      snackbarStore.showSnackbar({ text: message, color: 'error' })
    }
  }

  async function cancelOrder(orderId: number) {
    try {
      await orderService.updateStatus(orderId, 'Cancelled')
      await loadOrders()
      snackbarStore.showSnackbar({
        show: true,
        text: 'Order cancelled',
        color: 'success',
        timeout: 2000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel order'
      snackbarStore.showSnackbar({ text: message, color: 'error' })
    }
  }

  async function deleteOrder(orderId: number) {
    const confirmed = await confirm('Delete Order: ' + orderId + '?', {
      icon: 'mdi-alert',
    })
    if (confirmed) {
      try {
        await orderService.delete(orderId)
        await loadOrderItems()
        await loadOrders()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete order'
        snackbarStore.showSnackbar({ text: message, color: 'error' })
      }
    }
  }

  async function updateItemQuantity(item: OrderItem, quantity: number) {
    try {
      await orderItemService.updateQuantity(item.id, quantity)
      await loadOrderItems()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update quantity'
      snackbarStore.showSnackbar({ text: message, color: 'error' })
    }
  }

  async function deleteItem(orderItem: OrderItem) {
    const confirmed = await confirm('Delete Order Item: ' + orderItem.product + '?', {
      icon: 'mdi-alert',
    })
    if (confirmed) {
      try {
        await orderItemService.delete(orderItem.id)
        await loadOrderItems()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete order item'
        snackbarStore.showSnackbar({ text: message, color: 'error' })
      }
    }
  }

  return {
    // State
    productData,
    orderData,
    orderItemData,
    unitData,
    loading,
    headers,
    items,
    confirm,

    // Methods
    getOrderDate,
    getOrderStatus,
    getOrderCost,
    isNew,
    isSubmitted,
    loadOrders,
    loadOrderItems,
    loadData,
    submitOrder,
    receiveOrder,
    cancelOrder,
    deleteOrder,
    updateItemQuantity,
    deleteItem,
  }
}
