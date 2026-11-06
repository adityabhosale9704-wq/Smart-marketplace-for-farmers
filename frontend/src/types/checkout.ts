export interface DeliveryDetails {
  fullName: string
  mobile: string
  email: string
  addressLine1: string
  addressLine2: string
  city: string
  district: string
  state: string
  pinCode: string
  notes: string
}

export type DeliveryErrors = Partial<Record<keyof DeliveryDetails, string>>

export const emptyDeliveryDetails: DeliveryDetails = {
  fullName: '', mobile: '', email: '', addressLine1: '', addressLine2: '',
  city: '', district: '', state: '', pinCode: '', notes: '',
}
