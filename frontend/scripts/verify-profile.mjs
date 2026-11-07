import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true } })
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { mockProfile, demoMobilePlaceholder } = await load('data/mockProfile.ts')
  const { validateProfile, profileFieldLimits } = await load('utils/profileValidation.ts')
  const { default: Profile } = await load('pages/Profile.tsx')
  const { default: Card } = await load('components/profile/ProfileCard.tsx')
  const { default: Form } = await load('components/profile/EditProfileForm.tsx')
  const { default: Navigation } = await load('components/profile/AccountNavigation.tsx')
  const { default: Settings } = await load('components/profile/AccountSettings.tsx')
  const { CartContext } = await load('context/cartContextValue.ts')
  const original = JSON.stringify(mockProfile)
  assert.match(mockProfile.email, /@example\.com$/)
  assert.equal(mockProfile.mobile, '')
  assert.ok(demoMobilePlaceholder.includes('XXXXXXXXX'))
  assert.ok(!('id' in mockProfile))
  assert.deepEqual(validateProfile(mockProfile).errors, {})
  const edited = validateProfile({ ...mockProfile, fullName: '  Another   Sample Farmer ', email: ' another@example.com ', mobile: '9' + '8'.repeat(9), city: ' Another Village ' })
  assert.deepEqual(edited.errors, {})
  assert.equal(edited.profile.fullName, 'Another Sample Farmer')
  assert.equal(edited.profile.email, 'another@example.com')
  assert.equal(edited.profile.city, 'Another Village')
  assert.notEqual(edited.profile, mockProfile)
  assert.equal(JSON.stringify(mockProfile), original)
  for (const field of ['fullName','email','city','district','state','pinCode']) assert.ok(validateProfile({ ...mockProfile, [field]: '  ' }).errors[field], field)
  for (const email of ['bad', 'a@@b.com', 'a b@example.com', 'a@example..com']) assert.ok(validateProfile({ ...mockProfile, email }).errors.email)
  for (const mobile of ['1234', '1234567890', '9XXXXXXXXX', '+919876543210', 'abcdefghij']) assert.ok(validateProfile({ ...mockProfile, mobile }).errors.mobile)
  for (const pinCode of ['012345','12345','1234567','abcdef']) assert.ok(validateProfile({ ...mockProfile, pinCode }).errors.pinCode)
  for (const fullName of ['A','123','<script>']) assert.ok(validateProfile({ ...mockProfile, fullName }).errors.fullName)
  for (const [field, length] of Object.entries(profileFieldLimits)) assert.ok(validateProfile({ ...mockProfile, [field]: 'x'.repeat(length + 1) }).errors[field])

  const context = { cartItems: [], totalItemCount: 0, estimatedSubtotal: 0, message: '', storageWarning: false, addItem() {}, removeItem() {}, updateQuantity() {}, clearCart() {} }
  const render = element => renderToStaticMarkup(createElement(CartContext.Provider, { value: context }, createElement(MemoryRouter, { initialEntries: ['/profile'] }, element)))
  const html = render(createElement(Routes, null, createElement(Route, { path: '/profile', element: createElement(Profile) })))
  for (const text of ['My Profile','Public demonstration preview','Sample Farmer','farmer@example.com','9XXXXXXXXX','Edit Profile','href="/profile"','href="/login"','href="/register"']) assert.ok(html.includes(text), text)
  assert.ok(!html.includes('<form'))
  const card = render(createElement(Card, { profile: edited.profile, onEdit() {} }))
  assert.ok(card.includes('Another Sample Farmer'))
  assert.ok(card.includes('another@example.com'))
  const form = render(createElement(Form, { profile: mockProfile, onSave() {}, onCancel() {} }))
  assert.equal((form.match(/<input /g) || []).length, 7)
  assert.ok(form.includes('Save Demo Changes'))
  assert.ok(form.includes('Cancel'))
  assert.ok(form.includes('value="farmer@example.com"'))
  assert.ok(form.includes('name="mobile" value=""'))
  const navigation = render(createElement(Navigation))
  for (const route of ['/marketplace','/cart','/my-orders','/seller/dashboard','/seller/add-product','/seller/products','/seller/orders']) assert.ok(navigation.includes('href="' + route + '"'))
  const settings = render(createElement(Settings))
  assert.equal((settings.match(/disabled=""/g) || []).length, 3)
  for (const label of ['Change Password','Account Security','Logout','Coming Soon','No account is signed in']) assert.ok(settings.includes(label))
  for (const path of ['pages/Profile.tsx','components/profile/EditProfileForm.tsx','utils/profileValidation.ts']) {
    const source = await readFile(new URL('../src/' + path, import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|document\.cookie|fetch\(|console\./.test(source))
  }
  const source = await readFile(new URL('../src/pages/Profile.tsx', import.meta.url), 'utf8')
  assert.ok(source.includes('Demo profile updated on this page only. No account information was saved.'))
  assert.ok(source.includes('setProfile({ ...updated })'))
  assert.ok(source.includes('useState<FarmerProfile>({ ...mockProfile })'))
  assert.equal(JSON.stringify(mockProfile), original)
  console.log('PASS: profile route/navbar, fictional seed and masked mobile, valid edits/normalization, required/length/email/mobile/PIN errors, immutable seed, default/editor/card rendering, seven buying/selling links, disabled settings, and no app storage/network/logging calls.')
  console.log('Manual browser checks remain: Edit/Save/Cancel/Escape interactions, inline errors and focus, live card updates, actual reload reset, mobile layout, and browser autofill behavior.')
} finally { await server.close() }
