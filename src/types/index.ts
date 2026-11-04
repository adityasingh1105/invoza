export type Address = {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  billingAddress: Address
  shippingAddress: Address
  createdAt: string
}

export type InvoiceItem = {
  description: string
  quantity: number
  price: number
}

export type InvoiceStatus = 'paid' | 'unpaid'

export type Invoice = {
  id: string
  customerId: string
  date: string
  dueDate: string
  items: InvoiceItem[]
  total: number
  status: InvoiceStatus
  createdAt: string
}
