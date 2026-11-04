import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { customerRepository, invoiceRepository } from '../lib/db'
import type { Customer, Invoice, InvoiceStatus } from '../types'

type AppContextValue = {
  customers: Customer[]
  invoices: Invoice[]
  selectedCustomerId: string | null
  loading: boolean
  selectCustomer: (id: string | null) => void
  addCustomer: (
    data: Omit<Customer, 'id' | 'createdAt'>,
  ) => Promise<Customer>
  removeCustomer: (id: string) => Promise<void>
  emailExists: (email: string) => Promise<boolean>
  addInvoice: (
    data: Omit<Invoice, 'id' | 'createdAt' | 'total' | 'status'> & {
      status?: InvoiceStatus
    },
  ) => Promise<Invoice>
  setInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>
  removeInvoice: (id: string) => Promise<void>
  invoicesForSelected: Invoice[]
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  )
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [nextCustomers, nextInvoices] = await Promise.all([
      customerRepository.getAll(),
      invoiceRepository.getAll(),
    ])
    setCustomers(nextCustomers)
    setInvoices(nextInvoices)
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      await refresh()
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [refresh])

  async function addCustomer(data: Omit<Customer, 'id' | 'createdAt'>) {
    const customer = await customerRepository.create(data)
    await refresh()
    setSelectedCustomerId(customer.id)
    return customer
  }

  async function removeCustomer(id: string) {
    await customerRepository.remove(id)
    setSelectedCustomerId((current) => (current === id ? null : current))
    await refresh()
  }

  async function addInvoice(
    data: Omit<Invoice, 'id' | 'createdAt' | 'total' | 'status'> & {
      status?: InvoiceStatus
    },
  ) {
    const invoice = await invoiceRepository.create(data)
    await refresh()
    return invoice
  }

  async function setInvoiceStatus(id: string, status: InvoiceStatus) {
    await invoiceRepository.updateStatus(id, status)
    await refresh()
  }

  async function removeInvoice(id: string) {
    await invoiceRepository.remove(id)
    await refresh()
  }

  const value: AppContextValue = {
    customers,
    invoices,
    selectedCustomerId,
    loading,
    selectCustomer: setSelectedCustomerId,
    addCustomer,
    removeCustomer,
    emailExists: customerRepository.emailExists,
    addInvoice,
    setInvoiceStatus,
    removeInvoice,
    invoicesForSelected: selectedCustomerId
      ? invoices.filter((invoice) => invoice.customerId === selectedCustomerId)
      : [],
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider')
  }
  return ctx
}
