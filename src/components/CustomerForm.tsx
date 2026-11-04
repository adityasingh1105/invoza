import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState, type ReactNode } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { useApp } from '../context/AppContext'
import {
  addressStepSchema,
  createCustomerSchema,
  createPersonalSchema,
  customerDefaults,
  type CustomerFormValues,
} from '../schemas'

const steps = ['Personal', 'Address', 'Review'] as const

export function CustomerForm() {
  const { addCustomer, emailExists } = useApp()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)

  const schema = useMemo(
    () => createCustomerSchema(emailExists),
    [emailExists],
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: customerDefaults,
    mode: 'onSubmit',
  })

  const sameAsBilling = watch('sameAsBilling')
  const values = watch()

  async function goNext() {
    clearErrors()
    setChecking(true)
    try {
      const data = getValues()
      if (step === 0) {
        const result = await createPersonalSchema(emailExists).safeParseAsync({
          name: data.name,
          email: data.email,
          phone: data.phone,
        })
        if (!result.success) {
          for (const issue of result.error.issues) {
            const path = issue.path.join('.') as FieldPath<CustomerFormValues>
            if (path) setError(path, { type: 'manual', message: issue.message })
          }
          return
        }
      } else {
        const result = addressStepSchema.safeParse({
          sameAsBilling: data.sameAsBilling,
          billingAddress: data.billingAddress,
          shippingAddress: data.shippingAddress,
        })
        if (!result.success) {
          for (const issue of result.error.issues) {
            const path = issue.path.join('.') as FieldPath<CustomerFormValues>
            if (path) setError(path, { type: 'manual', message: issue.message })
          }
          return
        }
      }
      setStep((current) => current + 1)
    } finally {
      setChecking(false)
    }
  }

  async function onSubmit(data: CustomerFormValues) {
    setSaving(true)
    try {
      await addCustomer({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        billingAddress: data.billingAddress,
        shippingAddress: data.sameAsBilling
          ? data.billingAddress
          : data.shippingAddress,
      })
      reset(customerDefaults)
      setStep(0)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-semibold text-[var(--ink)]">
          New customer
        </h2>
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
          {steps.map((label, index) => (
            <li
              key={label}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                index === step
                  ? 'bg-[var(--accent)] text-white'
                  : index < step
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'bg-gray-100 text-[var(--muted)]'
              }`}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" error={errors.name?.message} className="sm:col-span-2">
              <input
                className={inputClass}
                {...register('name')}
                placeholder="Enter the name"
              />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input
                className={inputClass}
                type="email"
                {...register('email')}
                placeholder="Enter the email"
              />
            </Field>
            <Field
              label="Phone"
              error={errors.phone?.message}
              hint="Optional when email is provided"
            >
              <input
                className={inputClass}
                {...register('phone')}
                placeholder="Enter the phone"
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <AddressBlock
              title="Billing address"
              prefix="billingAddress"
              register={register}
              errors={errors.billingAddress}
            />

            <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
              <input
                type="checkbox"
                checked={sameAsBilling}
                onChange={(event) => {
                  const checked = event.target.checked
                  setValue('sameAsBilling', checked)
                  if (checked) {
                    setValue('shippingAddress', getValues('billingAddress'))
                  }
                }}
              />
              Shipping address same as billing
            </label>

            {!sameAsBilling && (
              <AddressBlock
                title="Shipping address"
                prefix="shippingAddress"
                register={register}
                errors={errors.shippingAddress}
              />
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 rounded-lg border border-[var(--line)] bg-gray-50 p-4 text-sm">
            <ReviewRow label="Name" value={values.name} />
            <ReviewRow label="Email" value={values.email || '—'} />
            <ReviewRow label="Phone" value={values.phone || '—'} />
            <ReviewRow
              label="Billing"
              value={formatAddress(values.billingAddress)}
            />
            <ReviewRow
              label="Shipping"
              value={
                values.sameAsBilling
                  ? 'Same as billing'
                  : formatAddress(values.shippingAddress)
              }
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            className={secondaryBtn}
            disabled={step === 0 || saving}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              className={primaryBtn}
              onClick={() => void goNext()}
              disabled={checking}
            >
              {checking ? 'Checking…' : 'Continue'}
            </button>
          ) : (
            <button type="submit" className={primaryBtn} disabled={saving}>
              {saving ? 'Saving…' : 'Create customer'}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

function AddressBlock({
  title,
  prefix,
  register,
  errors,
}: {
  title: string
  prefix: 'billingAddress' | 'shippingAddress'
  register: ReturnType<typeof useForm<CustomerFormValues>>['register']
  errors?: {
    street?: { message?: string }
    city?: { message?: string }
    state?: { message?: string }
    zip?: { message?: string }
    country?: { message?: string }
  }
}) {
  return (
    <fieldset className="space-y-3 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold text-[var(--ink)]">
        {title}
      </legend>
      <Field label="Street" error={errors?.street?.message}>
        <input
          className={inputClass}
          placeholder="Enter the street"
          {...register(`${prefix}.street`)}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City" error={errors?.city?.message}>
          <input
            className={inputClass}
            placeholder="Enter the city"
            {...register(`${prefix}.city`)}
          />
        </Field>
        <Field label="State" error={errors?.state?.message}>
          <input
            className={inputClass}
            placeholder="Enter the state"
            {...register(`${prefix}.state`)}
          />
        </Field>
        <Field label="ZIP" error={errors?.zip?.message}>
          <input
            className={inputClass}
            placeholder="Enter the zip"
            {...register(`${prefix}.zip`)}
          />
        </Field>
        <Field label="Country" error={errors?.country?.message}>
          <input
            className={inputClass}
            placeholder="Enter the country"
            {...register(`${prefix}.country`)}
          />
        </Field>
      </div>
    </fieldset>
  )
}

function Field({
  label,
  error,
  hint,
  className = '',
  children,
}: {
  label: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`block text-left text-sm ${className}`}>
      <span className="mb-1 block font-medium text-[var(--ink)]">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-[var(--muted)]">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-[var(--danger)]">{error}</span>
      )}
    </label>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-[var(--line)] pb-2 last:border-0 last:pb-0">
      <span className="w-20 shrink-0 text-[var(--muted)]">{label}</span>
      <span className="font-medium text-[var(--ink)]">{value}</span>
    </div>
  )
}

function formatAddress(address: CustomerFormValues['billingAddress']) {
  return [address.street, address.city, address.state, address.zip, address.country]
    .filter(Boolean)
    .join(', ')
}

const inputClass =
  'w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)]'

const primaryBtn =
  'rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'

const secondaryBtn =
  'rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] disabled:opacity-50'
