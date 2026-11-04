import { CustomerForm } from './components/CustomerForm'
import { CustomerList } from './components/CustomerList'
import { InvoiceForm } from './components/InvoiceForm'
import { InvoiceList } from './components/InvoiceList'
import { AppProvider } from './context/AppContext'

function App() {
  return (
    <AppProvider>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <p className="m-0 text-sm font-semibold tracking-wide text-[var(--accent)]">
            INVOZA
          </p>
          <h1 className="m-0 mt-1 text-3xl font-semibold tracking-tight text-[var(--ink)]">
            Customers & invoices
          </h1>
          <p className="mt-2 mb-0 max-w-xl text-sm text-[var(--muted)]">
            Create customers, raise invoices, and keep everything in your browser
            with IndexedDB.
          </p>
        </header>

        <div className="grid gap-5">
          <CustomerForm />
          <CustomerList />
          <InvoiceForm />
          <InvoiceList />
        </div>
      </div>
    </AppProvider>
  )
}

export default App
