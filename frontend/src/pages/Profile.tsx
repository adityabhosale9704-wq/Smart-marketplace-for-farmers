import { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProfileCard from '../components/profile/ProfileCard'
import EditProfileForm from '../components/profile/EditProfileForm'
import AccountNavigation from '../components/profile/AccountNavigation'
import AccountSettings from '../components/profile/AccountSettings'
import { AuthContext } from '../context/authContextValue'
import { AuthRequestError } from '../services/auth'
import { requestProfile } from '../services/profile'
import type { FarmerProfile, ProfileResult } from '../types/profile'

export default function Profile() {
  const auth = useContext(AuthContext)
  const userId = auth?.session?.user.id
  const [loaded, setLoaded] = useState<{ userId: string; result: ProfileResult } | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [authFailed, setAuthFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const pending = useRef<AbortController | null>(null)
  const current = loaded?.userId === userId ? loaded : null

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    pending.current = controller
    // Synchronize the page with the currently authenticated account.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoaded(null)
    setError('')
    setNotice('')
    setAuthFailed(false)
    setSaving(false)
    requestProfile('GET', userId, undefined, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setLoaded({ userId, result })
          setEditing(result.needsCompletion)
        }
      })
      .catch(failure => {
        if (!controller.signal.aborted) {
          setAuthFailed(failure instanceof AuthRequestError && failure.status === 401)
          setError(failure instanceof Error ? failure.message : 'Your profile could not be loaded.')
        }
      })
    return () => controller.abort()
  }, [userId, retry])

  function returnToEditButton() {
    document.getElementById('profile-edit-button')?.focus()
  }

  async function saveProfile(profile: FarmerProfile) {
    const controller = pending.current
    if (!userId || !controller || controller.signal.aborted || saving) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await requestProfile('PUT', userId, profile, controller.signal)
      if (!controller.signal.aborted) {
        setLoaded({ userId, result })
        setEditing(result.needsCompletion)
        setNotice('Your profile was saved.')
        returnToEditButton()
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setAuthFailed(failure instanceof AuthRequestError && failure.status === 401)
        setError(failure instanceof Error ? failure.message : 'Your profile could not be saved.')
      }
    } finally {
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50 py-10 sm:py-14">
        <div className="page-width">
          <h1 className="text-3xl font-bold text-emerald-950">My Profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Manage your farmer details for one account that supports both buying and selling.
          </p>
          {auth?.checking ? (
            <p role="status" className="mt-7">
              Checking your session...
            </p>
          ) : !userId || authFailed ? (
            <p className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4">
              Please{' '}
              <Link to="/login" className="font-semibold text-emerald-800 underline">
                log in
              </Link>{' '}
              to view and edit your private farmer profile.
            </p>
          ) : (
            <>
              {error && (
                <p role="alert" className="mt-5 text-sm text-red-700">
                  {error}
                </p>
              )}
              {!current && !error && (
                <p role="status" className="mt-7">
                  Loading your profile...
                </p>
              )}
              {!current && error && (
                <button
                  className="button-secondary mt-5"
                  onClick={() => setRetry(previous => previous + 1)}
                >
                  Try Again
                </button>
              )}
              {current && (
                <>
                  <p role="status" className="mt-4 text-sm font-medium leading-6 text-emerald-900">
                    {notice}
                  </p>
                  {current.result.needsCompletion && (
                    <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                      Complete your name and location below. Your mobile number is optional.
                    </p>
                  )}
                  <div className="mt-7 grid items-start gap-7 lg:grid-cols-[340px_minmax(0,1fr)]">
                    <ProfileCard
                      profile={current.result.profile}
                      onEdit={() => {
                        setEditing(true)
                        setNotice('')
                      }}
                    />
                    <div className="min-w-0 space-y-7">
                      {editing && (
                        <EditProfileForm
                          profile={current.result.profile}
                          onSave={saveProfile}
                          saving={saving}
                          onCancel={() => {
                            setEditing(false)
                            setError('')
                            returnToEditButton()
                          }}
                        />
                      )}
                      <AccountNavigation />
                      <AccountSettings />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
