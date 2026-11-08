import type { Product } from '../types/product'

export const mockProducts: Product[] = [
  {
    id: 'tomatoes',
    description:
      'Red tomatoes for everyday cooking, salads, and sauces. This sample listing illustrates a kilogram-based vegetable purchase; actual grade and freshness are not verified.',
    name: 'Fresh Red Tomatoes',
    category: 'vegetables',
    price: 32,
    unit: 'kg',
    availableQuantity: 250,
    seller: 'Ramesh Patil',
    location: 'Nashik, Maharashtra',
    image:
      'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'potatoes',
    description:
      'Potatoes suited to a variety of everyday recipes. This demonstration listing uses kilogram quantities and does not represent verified produce or availability.',
    name: 'Farm Fresh Potatoes',
    category: 'vegetables',
    price: 24,
    unit: 'kg',
    availableQuantity: 500,
    seller: 'Gurpreet Singh',
    location: 'Jalandhar, Punjab',
    image:
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'onions',
    description:
      'Red onions for curries, salads, and pantry essentials. This is an illustrative kilogram-based listing, with no verified grade or live inventory.',
    name: 'Red Onions',
    category: 'vegetables',
    price: 28,
    unit: 'kg',
    availableQuantity: 400,
    seller: 'Sunita Shinde',
    location: 'Pune, Maharashtra',
    image:
      'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'mangoes',
    description:
      'Alphonso mangoes shown as an example fruit listing. Variety, ripeness, and stock are illustrative and would need confirmation in a future marketplace.',
    name: 'Alphonso Mangoes',
    category: 'fruits',
    price: 180,
    unit: 'kg',
    availableQuantity: 120,
    seller: 'Vijay Desai',
    location: 'Ratnagiri, Maharashtra',
    image:
      'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'rice',
    description:
      'Basmati rice listed in quintals for a sample bulk purchase. One quintal is 100 kg; this demonstration does not verify grain quality or seller claims.',
    name: 'Premium Basmati Rice',
    category: 'grains',
    price: 6800,
    unit: 'quintal',
    availableQuantity: 20,
    seller: 'Harpreet Kaur',
    location: 'Karnal, Haryana',
    image:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'wheat',
    description:
      'Wheat offered as a sample bulk grain listing, priced per quintal. One quintal is 100 kg. No quality, harvest, or stock information is independently verified.',
    name: 'Golden Wheat',
    category: 'grains',
    price: 2600,
    unit: 'quintal',
    availableQuantity: 40,
    seller: 'Mohan Sharma',
    location: 'Sehore, Madhya Pradesh',
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'chilies',
    description:
      'Green chilies for cooking and food preparation, shown in kilogram units. This sample listing does not guarantee heat level, freshness, or live availability.',
    name: 'Fresh Green Chilies',
    category: 'vegetables',
    price: 60,
    unit: 'kg',
    availableQuantity: 80,
    seller: 'Lakshmi Reddy',
    location: 'Guntur, Andhra Pradesh',
    image:
      'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'tur-dal',
    description:
      'Unpolished tur dal shown as an example pulse listing priced per kilogram. Product characteristics and availability are demonstration information only.',
    name: 'Unpolished Tur Dal',
    category: 'pulses',
    price: 135,
    unit: 'kg',
    availableQuantity: 200,
    seller: 'Savita Patil',
    location: 'Kalaburagi, Karnataka',
    image:
      'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=700&q=80',
  },
]
