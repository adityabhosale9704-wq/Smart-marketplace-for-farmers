import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import type { AuthSession } from './types/auth'
import CartProvider from './context/CartContext'
import { AuthContext } from './context/authContextValue'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import MyOrders from './pages/MyOrders'
import Profile from './pages/Profile'
import SellerDashboard from './pages/seller/SellerDashboard'
import AddProduct from './pages/seller/AddProduct'
import MyProducts from './pages/seller/MyProducts'
import SellerOrders from './pages/seller/SellerOrders'
import Marketplace from './pages/Marketplace'
import ProductDetails from './pages/ProductDetails'

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null)

  return (
    <AuthContext.Provider value={{ session, clearSession: () => setSession(null) }}>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
            <Route path="/seller/products" element={<MyProducts />} />
            <Route path="/seller/add-product" element={<AddProduct />} />
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route
              path="/login"
              element={<Login session={session} onSessionChange={setSession} />}
            />
            <Route
              path="/register"
              element={<Register onSessionClear={() => setSession(null)} />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/products/:productId" element={<ProductDetails />} />
            <Route path="/products" element={<ProductDetails />} />
            <Route
              path="*"
              element={
                <main className="page-width py-20">
                  <h1 className="text-3xl font-bold">Page not found</h1>
                  <p className="mt-4">This page is not available.</p>
                  <Link to="/" className="button-primary mt-6">
                    Back to FarmMarket
                  </Link>
                </main>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthContext.Provider>
  )
}
