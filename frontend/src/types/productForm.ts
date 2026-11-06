import type { Product } from './product'

export interface ProductFormValues {
  name: string
  category: Product['category'] | ''
  description: string
  price: string
  unit: Product['unit'] | ''
  stock: string
  city: string
  district: string
  state: string
  harvestDate: string
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues | 'image', string>>

export interface ProductImageSelection {
  file: File
  url: string
}

export const emptyProductForm: ProductFormValues = {
  name: '', category: '', description: '', price: '', unit: '',
  stock: '', city: '', district: '', state: '', harvestDate: '',
}

export const productUnits: Product['unit'][] = ['kg', 'quintal']
