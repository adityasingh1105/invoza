import { useApp } from '../context/AppContext'
import type { InvoiceStatus } from '../types'

export function InvoiceList() {
  const {
    selectedCustomerId,
    customers,
    invoicesForSelected,
    setInvoiceStatus,
    removeInvoice,
  } = useApp()

  const customer = customers.find((item) => item.id === selectedCustomerId)

  if (!customer) {
    return null
  }

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      <h2 className="m-0 mb-4 text-lg font-semibold text-[var(--ink)]">
        Invoices for {customer.name}
      </h2>

      {invoicesForSelected.length === 0 ? (
        <p className="m-0 text-sm text-[var(--muted)]">No invoices yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Due</th>
                <th className="px-2 py-2 font-medium">Items</th>
                <th className="px-2 py-2 font-medium">Total</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {invoicesForSelected.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-[var(--line)] hover:bg-gray-50"
                >
                  <td className="px-2 py-2.5">{invoice.date}</td>
                  <td className="px-2 py-2.5">{invoice.dueDate}</td>
                  <td className="px-2 py-2.5">
                    {invoice.items.length} item
                    {invoice.items.length === 1 ? '' : 's'}
                  </td>
                  <td className="px-2 py-2.5 font-medium">
                    {formatMoney(invoice.total)}
                  </td>
                  <td className="px-2 py-2.5">
                    <StatusBadge status={invoice.status} />
                    <button
                      type="button"
                      className="ml-2 text-xs text-[var(--accent)]"
                      onClick={() => {
                        const next: InvoiceStatus =
                          invoice.status === 'paid' ? 'unpaid' : 'paid'
                        void setInvoiceStatus(invoice.id, next)
                      }}
                    >
                      Mark {invoice.status === 'paid' ? 'unpaid' : 'paid'}
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button
                      type="button"
                      className="text-xs text-[var(--danger)]"
                      onClick={() => {
                        if (window.confirm('Delete this invoice?')) {
                          void removeInvoice(invoice.id)
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const paid = status === 'paid'
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        paid
          ? 'bg-[var(--ok-soft)] text-[var(--ok)]'
          : 'bg-[var(--warn-soft)] text-[var(--warn)]'
      }`}
    >
      {paid ? 'Paid' : 'Unpaid'}
    </span>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}
