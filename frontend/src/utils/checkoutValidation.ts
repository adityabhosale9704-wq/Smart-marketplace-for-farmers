import type { DeliveryDetails, DeliveryErrors } from '../types/checkout'

export const fieldLimits: Record<keyof DeliveryDetails, number> = {
  fullName: 100,
  mobile: 10,
  email: 254,
  addressLine1: 200,
  addressLine2: 200,
  city: 100,
  district: 100,
  state: 100,
  pinCode: 6,
  notes: 500,
}

export function validateDeliveryDetails(input: DeliveryDetails): {
  details: DeliveryDetails
  errors: DeliveryErrors
} {
  const details = { ...input }
  const errors: DeliveryErrors = {}
  const required: (keyof DeliveryDetails)[] = [
    'fullName',
    'mobile',
    'addressLine1',
    'city',
    'district',
    'state',
    'pinCode',
  ]
  for (const field of Object.keys(details) as (keyof DeliveryDetails)[]) {
    details[field] = details[field].trim()
    if (field !== 'notes') details[field] = details[field].replace(/\s+/g, ' ')
    if (required.includes(field) && !details[field]) errors[field] = 'This field is required.'
    else if (details[field].length > fieldLimits[field])
      errors[field] = `Use ${fieldLimits[field]} characters or fewer.`
    else if (
      [...details[field]].some(character => {
        const code = character.charCodeAt(0)
        return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127
      })
    )
      errors[field] = 'Remove unsupported control characters.'
  }
  if (
    !errors.fullName &&
    (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(details.fullName) ||
      (details.fullName.match(/\p{L}/gu)?.length ?? 0) < 2)
  ) {
    errors.fullName = 'Enter a name with at least two letters, without numbers or symbols.'
  }
  if (!errors.mobile && !/^[6-9]\d{9}$/.test(details.mobile))
    errors.mobile = 'Enter a 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
  if (!errors.email && details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email))
    errors.email = 'Enter a valid email address or leave this optional field blank.'
  if (!errors.pinCode && !/^[1-9]\d{5}$/.test(details.pinCode))
    errors.pinCode = 'Enter a six-digit PIN code that does not start with zero.'
  if (
    !errors.addressLine1 &&
    (details.addressLine1.length < 5 || !/[\p{L}\p{N}]/u.test(details.addressLine1))
  )
    errors.addressLine1 = 'Enter a more complete address (at least five characters).'
  for (const field of ['city', 'district', 'state'] as const) {
    if (!errors[field] && !/\p{L}/u.test(details[field]))
      errors[field] = 'Enter a place name containing letters.'
  }
  return { details, errors }
}
