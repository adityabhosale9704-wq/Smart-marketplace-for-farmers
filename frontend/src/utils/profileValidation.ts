import type { FarmerProfile, ProfileErrors } from '../types/profile'

export const profileFieldLimits: Record<keyof FarmerProfile, number> = {
  fullName: 100,
  email: 254,
  mobile: 10,
  city: 100,
  district: 100,
  state: 100,
  pinCode: 6,
}

export function validateProfile(input: FarmerProfile): {
  profile: FarmerProfile
  errors: ProfileErrors
} {
  const profile = { ...input }
  const errors: ProfileErrors = {}
  for (const field of Object.keys(profile) as (keyof FarmerProfile)[]) {
    profile[field] = profile[field].trim()
    if (['fullName', 'city', 'district', 'state'].includes(field))
      profile[field] = profile[field].replace(/\s+/g, ' ')
    if (!profile[field] && field !== 'mobile') errors[field] = 'This field is required.'
    else if (profile[field].length > profileFieldLimits[field])
      errors[field] = `Use ${profileFieldLimits[field]} characters or fewer.`
    else if (
      [...profile[field]].some(
        character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
      )
    )
      errors[field] = 'Remove unsupported control characters.'
  }
  if (
    !errors.fullName &&
    (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(profile.fullName) ||
      (profile.fullName.match(/\p{L}/gu)?.length ?? 0) < 2)
  )
    errors.fullName = 'Enter a name with at least two letters and no numbers.'
  if (!errors.email && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(profile.email))
    errors.email = 'Enter a valid email address.'
  if (!errors.mobile && profile.mobile && !/^[6-9]\d{9}$/.test(profile.mobile))
    errors.mobile = 'Enter a 10-digit Indian mobile starting with 6, 7, 8, or 9, or leave blank.'
  for (const field of ['city', 'district', 'state'] as const) {
    if (!errors[field] && (profile[field].length < 2 || !/\p{L}/u.test(profile[field])))
      errors[field] = 'Enter a place name of at least two characters containing letters.'
  }
  if (!errors.pinCode && !/^[1-9]\d{5}$/.test(profile.pinCode))
    errors.pinCode = 'Enter a six-digit PIN code that does not start with zero.'
  return { profile, errors }
}
