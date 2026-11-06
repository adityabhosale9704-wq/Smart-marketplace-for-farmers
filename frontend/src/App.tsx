import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import CartProvider from './context/CartContext'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import SellerDashboard from './pages/seller/SellerDashboard'
import AddProduct from './pages/seller/AddProduct'
import MyProducts from './pages/seller/MyProducts'
import Marketplace from './pages/Marketplace'
import ProductDetails from './pages/ProductDetails'

export default function App() {
  return <CartProvider><BrowserRouter><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/seller/products" element={<MyProducts />} />
    <Route path="/seller/add-product" element={<AddProduct />} />
    <Route path="/seller/dashboard" element={<SellerDashboard />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/products/:productId" element={<ProductDetails />} />
    <Route path="/products" element={<ProductDetails />} />
    <Route path="*" element={<main className="page-width py-20"><h1 className="text-3xl font-bold">Page not found</h1><p className="mt-4">This page is not available.</p><Link to="/" className="button-primary mt-6">Back to FarmMarket</Link></main>} />
  </Routes></BrowserRouter></CartProvider>
}
