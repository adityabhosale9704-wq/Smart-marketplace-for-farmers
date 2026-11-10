import { useCart } from '../hooks/useCart'
import { NavLink, useNavigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import { AuthContext } from '../context/authContextValue'
import { Menu, ShoppingBasket, UserRound, X } from 'lucide-react'
import Brand from './Brand'

const mobileLinks = [
  ['Home', '/'],
  ['Marketplace', '/marketplace'],
  ['Sell Products', '/seller/dashboard'],
  ['About', '/#about'],
  ['My Orders (Demo)', '/my-orders'],
  ['My Profile', '/profile'],
]

function navigationLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'text-emerald-700' : ''
}

export default function Navbar() {
  const { totalItemCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  async function logout() {
    if (!auth || signingOut) return
    setSigningOut(true)
    setLogoutError('')
    try {
      await auth.signOut()
      setMenuOpen(false)
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Could not sign out. Please retry.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
      {logoutError && (
        <p role="alert" className="page-width py-2 text-sm text-red-700">
          {logoutError}
        </p>
      )}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:block focus:p-3">
        Skip to content
      </a>
      <div className="page-width flex min-h-22 flex-wrap items-center justify-between gap-2 sm:gap-5">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-4 text-sm font-semibold lg:flex"
        >
          <NavLink to="/" end className={navigationLinkClass}>
            Home
          </NavLink>
          <NavLink to="/marketplace" className={navigationLinkClass}>
            Marketplace
          </NavLink>
          <NavLink to="/seller/dashboard" className={navigationLinkClass}>
            Sell Products
          </NavLink>
          <a href="/#about">About</a>
          <NavLink
            to="/my-orders"
            title="Public demonstration preview"
            className={navigationLinkClass}
          >
            My Orders <span className="text-[10px] font-normal">(Demo)</span>
          </NavLink>
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          {auth?.checking ? (
            <span role="status">Checking session...</span>
          ) : auth?.session ? (
            <button type="button" disabled={signingOut} className="button-primary" onClick={logout}>
              {signingOut ? 'Logging out...' : 'Logout'}
            </button>
          ) : (
            <>
              <NavLink to="/login" className="text-sm font-semibold text-emerald-800">
                Login
              </NavLink>
              <NavLink to="/register" className="button-primary">
                Register
              </NavLink>
            </>
          )}
        </div>
        <NavLink
          to="/profile"
          title="My farmer profile"
          aria-label="My Profile"
          className="ml-auto flex shrink-0 flex-col items-center rounded-lg border border-stone-200 p-2 text-emerald-900 lg:ml-0"
        >
          <UserRound aria-hidden="true" className="size-5" />
          <span className="mt-0.5 text-[10px]">Profile</span>
        </NavLink>
        <NavLink
          to="/cart"
          aria-label={`Shopping cart, ${totalItemCount} selected listed units, not combined weight`}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 px-2 py-2 text-emerald-900 lg:ml-0"
        >
          <ShoppingBasket aria-hidden="true" className="size-5" />
          <span
            aria-hidden="true"
            className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-bold text-white"
          >
            {totalItemCount}
          </span>
          <span className="sr-only">Selected listed units</span>
        </NavLink>
        <button
          className="rounded-lg border border-stone-200 p-2 lg:hidden"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="page-width grid gap-4 border-t border-stone-100 py-5 lg:hidden"
        >
          {mobileLinks.map(([label, href]) => {
            if (href.includes('#')) {
              return (
                <a key={label} href={href} onClick={() => setMenuOpen(false)}>
                  {label}
                </a>
              )
            }

            return (
              <NavLink key={label} to={href} end={href === '/'} onClick={() => setMenuOpen(false)}>
                {label}
              </NavLink>
            )
          })}
          {auth?.checking ? (
            <span role="status">Checking session...</span>
          ) : auth?.session ? (
            <button
              type="button"
              disabled={signingOut}
              className="text-left font-semibold text-emerald-800"
              onClick={logout}
            >
              {signingOut ? 'Logging out...' : 'Logout'}
            </button>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>
                Login
              </NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
