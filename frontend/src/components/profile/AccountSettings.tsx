import { KeyRound, Shield, LogOut } from 'lucide-react'

export default function AccountSettings() {
  return (
    <section
      aria-labelledby="account-settings-title"
      className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7"
    >
      <h2 id="account-settings-title" className="text-xl font-bold text-emerald-950">
        Account Settings
      </h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Future settings only. No account is signed in, so password changes and logout are not
        available.
      </p>
      <ul className="mt-5 space-y-2">
        {[
          { label: 'Change Password', icon: KeyRound },
          { label: 'Account Security', icon: Shield },
          { label: 'Logout', icon: LogOut },
        ].map(setting => (
          <li key={setting.label}>
            <button
              disabled
              className="flex w-full cursor-not-allowed flex-wrap items-center gap-3 rounded-xl border border-stone-200 p-4 text-left text-sm text-stone-500"
            >
              <setting.icon aria-hidden="true" className="size-5 shrink-0" />
              <span>{setting.label}</span>
              <span className="ml-auto rounded bg-stone-100 px-2 py-1 text-xs">Coming Soon</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
