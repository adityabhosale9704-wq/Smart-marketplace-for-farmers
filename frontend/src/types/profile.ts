export interface FarmerProfile {
  fullName: string
  email: string
  mobile: string
  city: string
  district: string
  state: string
  pinCode: string
}

export type ProfileErrors = Partial<Record<keyof FarmerProfile, string>>

export interface ProfileResult {
  profile: FarmerProfile
  needsCompletion: boolean
}
