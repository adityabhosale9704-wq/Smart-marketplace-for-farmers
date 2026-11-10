import { UserRound, MapPin } from 'lucide-react'
import type { FarmerProfile } from '../../types/profile'

export default function ProfileCard({
  profile,
  onEdit,
}: {
  profile: FarmerProfile
  onEdit: () => void
}) {
  return (
    <section
      aria-labelledby="profile-summary-title"
      className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7"
    >
      <div className="flex size-18 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
        <UserRound aria-hidden="true" className="size-9" />
      </div>
      <p className="mt-5 text-xs font-bold tracking-widest text-emerald-700">FARMER PROFILE</p>
      <h2
        id="profile-summary-title"
        className="mt-3 break-words text-2xl font-bold text-emerald-950"
      >
        {profile.fullName || 'Complete your profile'}
      </h2>
      <p className="mt-3 flex items-start gap-2 text-sm text-stone-600">
        <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span className="break-words">
          {[profile.city, profile.state].filter(Boolean).join(', ') || 'Location not provided'}
        </span>
      </p>
      <dl className="mt-6 space-y-4 border-t border-stone-100 pt-5 text-sm">
        {[
          ['Email', profile.email],
          ['Mobile', profile.mobile],
          ['Village / City', profile.city],
          ['District', profile.district],
          ['State', profile.state],
          ['PIN code', profile.pinCode],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold text-stone-500">{label}</dt>
            <dd className="mt-1 break-words text-stone-800">{value || 'Not provided'}</dd>
          </div>
        ))}
      </dl>
      <button id="profile-edit-button" onClick={onEdit} className="button-primary mt-6 w-full">
        Edit Profile
      </button>
      <p className="mt-4 text-xs leading-6 text-stone-500">
        Your contact details are private. Displaying them here does not verify phone or address
        ownership.
      </p>
    </section>
  )
}
