import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Package, ClipboardList } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import StatCard from '../../components/seller/StatCard'
import { AuthContext } from '../../context/authContextValue'
import { AuthRequestError } from '../../services/auth'
import { getAdminDashboard } from '../../services/admin'

export default function AdminDashboard() {
  const auth = useContext(AuthContext)
  const userId = auth?.session?.user.id
  const [retry, setRetry] = useState(0)
  const key = `${userId ?? ''}:${retry}`
  const [result, setResult] = useState<{
    key: string
    counts: { users: number; products: number; orders: number } | null
    error: string
    unauthorized: boolean
  } | null>(null)
  const current = result?.key === key ? result : null

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    getAdminDashboard(userId, controller.signal)
      .then(counts => {
        if (!controller.signal.aborted) setResult({ key, counts, error: '', unauthorized: false })
      })
      .catch(error => {
        if (!controller.signal.aborted)
          setResult({
            key,
            counts: null,
            error:
              error instanceof Error
                ? error.message
                : 'The administrator dashboard is unavailable.',
            unauthorized: error instanceof AuthRequestError && [401, 403].includes(error.status),
          })
      })
    return () => controller.abort()
  }, [userId, key])

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50 py-10 sm:py-14">
        <div className="page-width space-y-7">
          <h1 className="text-3xl font-bold text-emerald-950">Administrator Dashboard</h1>
          {auth?.checking ? (
            <p role="status">Checking your session...</p>
          ) : !userId ? (
            <p>
              Please{' '}
              <Link to="/admin/login" className="font-semibold text-emerald-800 underline">
                log in as an administrator
              </Link>{' '}
              to continue.
            </p>
          ) : !current ? (
            <p role="status">Checking administrator access and loading counts...</p>
          ) : current.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <h2 className="font-semibold">
                {current.unauthorized ? 'Administrator access required' : 'Dashboard unavailable'}
              </h2>
              <p role="alert" className="mt-3 text-sm text-red-800">
                {current.error}
              </p>
              <button
                onClick={() => setRetry(previous => previous + 1)}
                className="button-secondary mt-4"
              >
                Try Again
              </button>
              <Link
                to="/admin/login"
                className="ml-4 text-sm font-semibold text-emerald-800 underline"
              >
                Administrator login
              </Link>
            </div>
          ) : (
            current.counts && (
              <>
                <div className="grid gap-5 sm:grid-cols-3">
                  <StatCard
                    label="Registered Accounts"
                    value={current.counts.users}
                    explanation="All Supabase Auth accounts, including accounts awaiting email confirmation."
                    icon={Users}
                  />
                  <StatCard
                    label="Products"
                    value={current.counts.products}
                    explanation="All stored products, including drafts and out-of-stock listings."
                    icon={Package}
                  />
                  <StatCard
                    label="Orders"
                    value={current.counts.orders}
                    explanation="Stored orders only. Frontend demonstration orders are excluded."
                    icon={ClipboardList}
                  />
                </div>
                <button
                  onClick={() => setRetry(previous => previous + 1)}
                  className="button-secondary"
                >
                  Refresh Counts
                </button>
                <nav
                  aria-label="Future administrator management"
                  className="grid gap-4 sm:grid-cols-3"
                >
                  {['User Management', 'Product Management', 'Order Management'].map(label => (
                    <button
                      key={label}
                      disabled
                      className="cursor-not-allowed rounded-xl border border-stone-200 bg-white p-5 text-left text-stone-500"
                    >
                      {label}
                      <span className="mt-2 block text-xs">Coming Soon</span>
                    </button>
                  ))}
                </nav>
              </>
            )
          )}
          <Link
            to="/marketplace"
            className="inline-block text-sm font-semibold text-emerald-800 underline"
          >
            Back to Marketplace
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
