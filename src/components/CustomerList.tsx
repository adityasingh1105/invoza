import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'

type SortKey = 'name' | 'email' | 'createdAt'

const PAGE_SIZE = 5

export function CustomerList() {
  const {
    customers,
    selectedCustomerId,
    selectCustomer,
    removeCustomer,
    loading,
  } = useApp()
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = customers.filter((customer) => {
      if (!q) return true
      return (
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.phone.toLowerCase().includes(q)
      )
    })

    list.sort((a, b) => {
      const left = a[sortKey]
      const right = b[sortKey]
      const cmp = left.localeCompare(right, undefined, { sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [customers, query, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  function changeSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-semibold text-[var(--ink)]">
          Customers
        </h2>
        <input
          className="w-full max-w-xs rounded-md border border-[var(--line)] px-3 py-2 text-sm sm:w-56"
          placeholder="Filter by name, email, phone"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
        />
      </div>

      {loading ? (
        <p className="m-0 text-sm text-[var(--muted)]">Loading customers…</p>
      ) : filtered.length === 0 ? (
        <p className="m-0 text-sm text-[var(--muted)]">No customers found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                  <th className="px-2 py-2 font-medium">
                    <button type="button" className={sortBtn} onClick={() => changeSort('name')}>
                      Name {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </th>
                  <th className="px-2 py-2 font-medium">
                    <button type="button" className={sortBtn} onClick={() => changeSort('email')}>
                      Email {sortKey === 'email' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </th>
                  <th className="px-2 py-2 font-medium">Phone</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((customer) => {
                  const selected = customer.id === selectedCustomerId
                  return (
                    <tr
                      key={customer.id}
                      className={`border-b border-[var(--line)] ${
                        selected ? 'bg-[var(--accent-soft)]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-2 py-2.5">
                        <button
                          type="button"
                          className="text-left font-medium text-[var(--accent)]"
                          onClick={() => selectCustomer(customer.id)}
                        >
                          {customer.name}
                        </button>
                      </td>
                      <td className="px-2 py-2.5 text-[var(--ink)]">
                        {customer.email || '—'}
                      </td>
                      <td className="px-2 py-2.5 text-[var(--ink)]">
                        {customer.phone || '—'}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <button
                          type="button"
                          className="text-xs text-[var(--danger)]"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete ${customer.name}? Related invoices will be removed.`,
                              )
                            ) {
                              void removeCustomer(customer.id)
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <span>
              {filtered.length} customer{filtered.length === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={pageBtn}
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className={pageBtn}
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

const sortBtn = 'bg-transparent p-0 font-medium text-[var(--muted)]'
const pageBtn =
  'rounded border border-[var(--line)] bg-white px-2 py-1 text-[var(--ink)] disabled:opacity-40'
