export interface Product {
  id: number
  name: string
  unit_price: number
  unit_id: number
  vendor_id: number
  category_id: number
  // Joined fields
  unit?: string
  category?: string
  vendor?: string
}

export interface Category {
  id: number
  name: string
}

export interface Vendor {
  id: number
  name: string
}

export interface Unit {
  id: number
  name: string
}

export interface InvoiceItemTemplate {
  id: number
  name: string
  price_per_unit: number | null
}

export interface InventoryItem {
  id: number
  product_id: number
  quantity: number
  capacity: number
  reorder_level: number
  cost: number
  needed_at_store: number
  // Joined fields
  product?: string
  unit?: string
  category?: string
}

export interface Order {
  id: number
  date: string
  status: 'New' | 'Submitted' | 'Received' | 'Cancelled'
  cost: number
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  // Joined fields
  product?: string
  unit?: string
}

export interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
}

export interface Invoice {
  id: number
  invoice_number: number
  customer_id: number
  date?: string
  paid: boolean
  subtotal?: number
  // Joined fields
  customer?: string
}

export interface InvoiceItem {
  id: number
  invoice_id: number
  description: string
  quantity: number
  price_per_unit: number
  date_of_service?: string
  amount?: number
}

export interface User {
  access_token: string
  refresh_token: string
  name: string
  role?: 'admin' | 'user'
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface PaginatedResponse<T> {
  results: T[]
  total: number
  page: number
  pages: number
}
