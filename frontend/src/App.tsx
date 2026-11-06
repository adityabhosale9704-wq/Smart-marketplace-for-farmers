import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import CartProvider from './context/CartContext'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import ProductDetails from './pages/ProductDetails'

export default function App() {
  return <CartProvider><BrowserRouter><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/products/:productId" element={<ProductDetails />} />
    <Route path="/products" element={<ProductDetails />} />
    <Route path="*" element={<main className="page-width py-20"><h1 className="text-3xl font-bold">Page not found</h1><p className="mt-4">This page is not available.</p><Link to="/" className="button-primary mt-6">Back to FarmMarket</Link></main>} />
  </Routes></BrowserRouter></CartProvider>
}
