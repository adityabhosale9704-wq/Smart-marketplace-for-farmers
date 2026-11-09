import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { logoutFarmer, watchAuthSession } from './services/auth'
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
  const [checking, setChecking] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(
    () =>
      watchAuthSession((verified, error, pending) => {
        setSession(verified)
        setAuthError(error)
        setChecking(pending)
      }),
    [],
  )

  async function signOut() {
    await logoutFarmer()
    setSession(null)
    setAuthError('')
  }

  return (
    <AuthContext.Provider value={{ session, checking, signOut }}>
      {authError && (
        <p role="alert" className="bg-amber-50 p-3 text-center text-sm text-amber-950">
          {authError}
        </p>
      )}
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
            <Route path="/login" element={<Login session={session} />} />
            <Route path="/register" element={<Register />} />
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
