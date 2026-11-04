import { z } from 'zod'

const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(3, 'ZIP is required'),
  country: z.string().min(1, 'Country is required'),
})

const softAddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
})

function addContactIssues(
  data: { email: string; phone: string },
  ctx: z.RefinementCtx,
) {
  const email = data.email.trim()
  const phone = data.phone.trim()

  if (email) {
    const emailCheck = z.email().safeParse(email)
    if (!emailCheck.success) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Enter a valid email',
      })
    }
  }

  if (!email && !phone) {
    ctx.addIssue({
      code: 'custom',
      path: ['email'],
      message: 'Provide an email or phone number',
    })
    ctx.addIssue({
      code: 'custom',
      path: ['phone'],
      message: 'Provide an email or phone number',
    })
  }

  if (phone && !/^\+?[\d\s()-]{7,20}$/.test(phone)) {
    ctx.addIssue({
      code: 'custom',
      path: ['phone'],
      message: 'Enter a valid phone number',
    })
  }
}

export function createPersonalSchema(
  emailExists: (email: string) => Promise<boolean>,
) {
  return z
    .object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string(),
      phone: z.string(),
    })
    .superRefine(async (data, ctx) => {
      addContactIssues(data, ctx)
      const email = data.email.trim()
      if (email && z.email().safeParse(email).success && (await emailExists(email))) {
        ctx.addIssue({
          code: 'custom',
          path: ['email'],
          message: 'A customer with this email already exists',
        })
      }
    })
}

export const addressStepSchema = z
  .object({
    sameAsBilling: z.boolean(),
    billingAddress: addressSchema,
    shippingAddress: softAddressSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.sameAsBilling) {
      const shipping = addressSchema.safeParse(data.shippingAddress)
      if (!shipping.success) {
        for (const issue of shipping.error.issues) {
          ctx.addIssue({
            code: 'custom',
            path: ['shippingAddress', ...issue.path],
            message: issue.message,
          })
        }
      }
    }
  })

export function createCustomerSchema(
  emailExists: (email: string) => Promise<boolean>,
) {
  return z
    .object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string(),
      phone: z.string(),
      sameAsBilling: z.boolean(),
      billingAddress: addressSchema,
      shippingAddress: softAddressSchema,
    })
    .superRefine(async (data, ctx) => {
      addContactIssues(data, ctx)
      const email = data.email.trim()
      if (email && z.email().safeParse(email).success && (await emailExists(email))) {
        ctx.addIssue({
          code: 'custom',
          path: ['email'],
          message: 'A customer with this email already exists',
        })
      }

      if (!data.sameAsBilling) {
        const shipping = addressSchema.safeParse(data.shippingAddress)
        if (!shipping.success) {
          for (const issue of shipping.error.issues) {
            ctx.addIssue({
              code: 'custom',
              path: ['shippingAddress', ...issue.path],
              message: issue.message,
            })
          }
        }
      }
    })
}

export type CustomerFormValues = z.infer<ReturnType<typeof createCustomerSchema>>

export const invoiceSchema = z
  .object({
    date: z.string().min(1, 'Date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    items: z
      .array(
        z.object({
          description: z.string().min(1, 'Description is required'),
          quantity: z.coerce.number().positive('Quantity must be greater than 0'),
          price: z.coerce.number().nonnegative('Price cannot be negative'),
        }),
      )
      .min(1, 'Add at least one item'),
  })
  .refine((data) => data.dueDate >= data.date, {
    message: 'Due date must be on or after invoice date',
    path: ['dueDate'],
  })

export type InvoiceFormValues = z.infer<typeof invoiceSchema>

export const emptyAddress = {
  street: '',
  city: '',
  state: '',
  zip: '',
  country: '',
}

export const customerDefaults: CustomerFormValues = {
  name: '',
  email: '',
  phone: '',
  sameAsBilling: true,
  billingAddress: { ...emptyAddress },
  shippingAddress: { ...emptyAddress },
}
