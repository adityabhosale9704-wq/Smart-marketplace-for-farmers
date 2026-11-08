import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProfileCard from '../components/profile/ProfileCard'
import EditProfileForm from '../components/profile/EditProfileForm'
import AccountNavigation from '../components/profile/AccountNavigation'
import AccountSettings from '../components/profile/AccountSettings'
import { mockProfile } from '../data/mockProfile'
import type { FarmerProfile } from '../types/profile'

export default function Profile() {
  const [profile, setProfile] = useState<FarmerProfile>({ ...mockProfile })
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')

  function returnToEditButton() {
    document.getElementById('profile-edit-button')?.focus()
  }

  function saveDemoChanges(updated: FarmerProfile) {
    setProfile({ ...updated })
    setEditing(false)
    setNotice('Demo profile updated on this page only. No account information was saved.')
    returnToEditButton()
  }

  function cancel() {
    setEditing(false)
    setNotice('Edits cancelled. The displayed sample profile is unchanged.')
    returnToEditButton()
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50 py-10 sm:py-14">
        <div className="page-width">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Public demonstration preview.</strong> No farmer is signed in. All seeded
            details are fictional and unverified. Use only sample details; the app does not send or
            save profile data.
          </p>
          <h1 className="mt-7 text-3xl font-bold text-emerald-950">My Profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Explore one future farmer account for both buying and selling. Editing this preview does
            not create an identity, account, or session.
          </p>
          <p role="status" className="mt-4 text-sm font-medium leading-6 text-emerald-900">
            {notice}
          </p>
          <div className="mt-7 grid items-start gap-7 lg:grid-cols-[340px_minmax(0,1fr)]">
            <ProfileCard
              profile={profile}
              onEdit={() => {
                setEditing(true)
                setNotice('')
              }}
            />
            <div className="min-w-0 space-y-7">
              {editing && (
                <EditProfileForm profile={profile} onSave={saveDemoChanges} onCancel={cancel} />
              )}
              <AccountNavigation />
              <AccountSettings />
            </div>
          </div>
          <p className="mt-7 text-xs leading-6 text-stone-500">
            Edits reset when leaving or reloading this page. Client-side state does not grant
            ownership or permissions. Future integration requires real identity from Supabase Auth,
            JWT verification and authorization on Express, and profile storage in PostgreSQL.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
