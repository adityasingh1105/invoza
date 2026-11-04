import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { useApp } from '../context/AppContext'
import { invoiceSchema, type InvoiceFormValues } from '../schemas'

type InvoiceFormInput = z.input<typeof invoiceSchema>

function today() {
  return new Date().toISOString().slice(0, 10)
}

function inDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function InvoiceForm() {
  const { selectedCustomerId, customers, addInvoice } = useApp()
  const customer = customers.find((item) => item.id === selectedCustomerId)

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormInput, unknown, InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      date: today(),
      dueDate: inDays(14),
      items: [{ description: '', quantity: 1, price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const items = watch('items')
  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.price) || 0
    return sum + qty * price
  }, 0)

  async function onSubmit(data: InvoiceFormValues) {
    if (!selectedCustomerId) return
    await addInvoice({
      customerId: selectedCustomerId,
      date: data.date,
      dueDate: data.dueDate,
      items: data.items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        price: Number(item.price),
      })),
    })
    reset({
      date: today(),
      dueDate: inDays(14),
      items: [{ description: '', quantity: 1, price: 0 }],
    })
  }

  if (!customer) {
    return (
      <section className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)] shadow-sm">
        Select a customer to create an invoice.
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      <h2 className="m-0 mb-1 text-lg font-semibold text-[var(--ink)]">
        New invoice
      </h2>
      <p className="mb-4 mt-0 text-sm text-[var(--muted)]">
        For {customer.name}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Date</span>
            <input
              type="date"
              className={inputClass}
              {...register('date')}
            />
            {errors.date && (
              <span className="mt-1 block text-xs text-[var(--danger)]">
                {errors.date.message}
              </span>
            )}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Due date</span>
            <input
              type="date"
              className={inputClass}
              {...register('dueDate')}
            />
            {errors.dueDate && (
              <span className="mt-1 block text-xs text-[var(--danger)]">
                {errors.dueDate.message}
              </span>
            )}
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                <th className="px-2 py-2 font-medium">Description</th>
                <th className="w-24 px-2 py-2 font-medium">Qty</th>
                <th className="w-28 px-2 py-2 font-medium">Price</th>
                <th className="w-28 px-2 py-2 font-medium">Line total</th>
                <th className="w-16 px-2 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const qty = Number(items[index]?.quantity) || 0
                const price = Number(items[index]?.price) || 0
                return (
                  <tr key={field.id} className="border-b border-[var(--line)] align-top">
                    <td className="px-2 py-2">
                      <input
                        className={inputClass}
                        {...register(`items.${index}.description`)}
                        placeholder="Enter the description"
                      />
                      {errors.items?.[index]?.description && (
                        <span className="mt-1 block text-xs text-[var(--danger)]">
                          {errors.items[index]?.description?.message}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className={inputClass}
                        {...register(`items.${index}.quantity`)}
                      />
                      {errors.items?.[index]?.quantity && (
                        <span className="mt-1 block text-xs text-[var(--danger)]">
                          {errors.items[index]?.quantity?.message}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className={inputClass}
                        {...register(`items.${index}.price`)}
                      />
                      {errors.items?.[index]?.price && (
                        <span className="mt-1 block text-xs text-[var(--danger)]">
                          {errors.items[index]?.price?.message}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 font-medium">
                      {formatMoney(qty * price)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        className="text-xs text-[var(--danger)] disabled:opacity-40"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {typeof errors.items?.message === 'string' && (
          <p className="m-0 text-xs text-[var(--danger)]">{errors.items.message}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
            onClick={() => append({ description: '', quantity: 1, price: 0 })}
          >
            Add item
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-[var(--ink)]">
              Total: {formatMoney(total)}
            </span>
            <button
              type="submit"
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Create invoice'}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

const inputClass =
  'w-full rounded-md border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm'
