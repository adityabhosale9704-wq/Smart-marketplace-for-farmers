import type { FarmerProfile } from '../types/profile'

// No user ID, session, real telephone number, or verified identity is represented.
export const demoMobilePlaceholder = '9XXXXXXXXX (fictional masked example)'

export const mockProfile: FarmerProfile = {
  fullName: 'Sample Farmer',
  email: 'farmer@example.com',
  mobile: '', // The card displays the masked example; the optional editor field starts blank.
  city: 'Sample Village',
  district: 'Sample District',
  state: 'Maharashtra',
  pinCode: '411001', // Format example only; this is not a personal or verified address.
}
