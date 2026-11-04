import localforage from 'localforage'
import type { Customer, Invoice } from '../types'

const customersStore = localforage.createInstance({
  name: 'invoza',
  storeName: 'customers',
})

const invoicesStore = localforage.createInstance({
  name: 'invoza',
  storeName: 'invoices',
})

function createId() {
  return crypto.randomUUID()
}

export const customerRepository = {
  async getAll(): Promise<Customer[]> {
    const items: Customer[] = []
    await customersStore.iterate<Customer, void>((value) => {
      items.push(value)
    })
    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },

  async getById(id: string): Promise<Customer | null> {
    return (await customersStore.getItem<Customer>(id)) ?? null
  },

  async emailExists(email: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase()
    let found = false
    await customersStore.iterate<Customer, void>((customer) => {
      if (customer.email.toLowerCase() === normalized) {
        found = true
      }
    })
    return found
  },

  async create(
    data: Omit<Customer, 'id' | 'createdAt'>,
  ): Promise<Customer> {
    const customer: Customer = {
      ...data,
      id: createId(),
      createdAt: new Date().toISOString(),
    }
    await customersStore.setItem(customer.id, customer)
    return customer
  },

  async remove(id: string): Promise<void> {
    await customersStore.removeItem(id)
    const invoices = await invoiceRepository.getByCustomer(id)
    await Promise.all(invoices.map((invoice) => invoicesStore.removeItem(invoice.id)))
  },
}

export const invoiceRepository = {
  async getAll(): Promise<Invoice[]> {
    const items: Invoice[] = []
    await invoicesStore.iterate<Invoice, void>((value) => {
      items.push(value)
    })
    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },

  async getByCustomer(customerId: string): Promise<Invoice[]> {
    const all = await this.getAll()
    return all.filter((invoice) => invoice.customerId === customerId)
  },

  async create(
    data: Omit<Invoice, 'id' | 'createdAt' | 'total' | 'status'> & {
      status?: Invoice['status']
    },
  ): Promise<Invoice> {
    const total = data.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    )
    const invoice: Invoice = {
      ...data,
      id: createId(),
      total,
      status: data.status ?? 'unpaid',
      createdAt: new Date().toISOString(),
    }
    await invoicesStore.setItem(invoice.id, invoice)
    return invoice
  },

  async updateStatus(id: string, status: Invoice['status']): Promise<Invoice | null> {
    const existing = await invoicesStore.getItem<Invoice>(id)
    if (!existing) return null
    const updated = { ...existing, status }
    await invoicesStore.setItem(id, updated)
    return updated
  },

  async remove(id: string): Promise<void> {
    await invoicesStore.removeItem(id)
  },
}
