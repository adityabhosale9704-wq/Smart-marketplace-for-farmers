import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { FarmerProfile, ProfileErrors } from '../../types/profile'
import { profileFieldLimits, validateProfile } from '../../utils/profileValidation'

interface EditProfileFormProps {
  profile: FarmerProfile
  onSave: (profile: FarmerProfile) => void
  onCancel: () => void
}

const fields: { name: keyof FarmerProfile; label: string; type?: 'text' | 'email' | 'tel'; autoComplete?: string; optional?: boolean }[] = [
  { name: 'fullName', label: 'Full Name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'mobile', label: 'Mobile (optional)', type: 'tel', autoComplete: 'tel-national', optional: true },
  { name: 'city', label: 'Village / City', autoComplete: 'address-level2' },
  { name: 'district', label: 'District' },
  { name: 'state', label: 'State', autoComplete: 'address-level1' },
  { name: 'pinCode', label: 'PIN Code', autoComplete: 'postal-code' },
]

export default function EditProfileForm({ profile, onSave, onCancel }: EditProfileFormProps) {
  const [draft, setDraft] = useState<FarmerProfile>({ ...profile })
  const [errors, setErrors] = useState<ProfileErrors>({})
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }) }, [])

  function change(field: keyof FarmerProfile, value: string) {
    setDraft(previous => ({ ...previous, [field]: value }))
    setErrors(previous => { const next = { ...previous }; delete next[field]; return next })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateProfile(draft)
    setErrors(result.errors)
    const first = Object.keys(result.errors)[0]
    if (first) { event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return }
    onSave(result.profile)
  }

  return (
    <section aria-labelledby={id + '-title'} className="min-w-0 rounded-2xl border border-emerald-200 bg-white p-5 sm:p-7" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onCancel() } }}>
      <h2 ref={heading} tabIndex={-1} id={id + '-title'} className="text-xl font-bold text-emerald-950">Edit sample profile</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">Use fictional details only. Fields marked * are required. Leave mobile blank to keep the masked demo placeholder; no real number is included in the seed.</p>
      <form noValidate onSubmit={submit} className="mt-5">
        {Object.keys(errors).length > 0 && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">Please correct the highlighted profile fields.</p>}
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map(field => <div key={field.name} className="min-w-0">
            <label htmlFor={id + '-' + field.name} className="text-sm font-semibold">{field.label}{!field.optional ? ' *' : ''}</label>
            <input id={id + '-' + field.name} name={field.name} type={field.type ?? 'text'} autoComplete={field.autoComplete}
              inputMode={field.name === 'pinCode' ? 'numeric' : undefined} required={!field.optional} maxLength={profileFieldLimits[field.name]}
              value={draft[field.name]} onChange={event => change(field.name, event.target.value)}
              aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? id + '-' + field.name + '-error' : undefined}
              className={`mt-2 w-full min-w-0 rounded-lg border bg-white px-3 py-3 text-sm ${errors[field.name] ? 'border-red-500' : 'border-stone-300'}`} />
            {errors[field.name] && <p id={id + '-' + field.name + '-error'} className="mt-2 text-sm text-red-700">{errors[field.name]}</p>}
          </div>)}
        </div>
        <p className="mt-5 text-xs leading-6 text-stone-500">Format checks do not verify identity, phone ownership, address ownership, or delivery coverage. No information is transmitted or persisted by the app.</p>
        <div className="mt-6 flex flex-wrap gap-3"><button type="submit" className="button-primary">Save Demo Changes</button><button type="button" onClick={onCancel} className="button-secondary">Cancel</button></div>
      </form>
    </section>
  )
}
