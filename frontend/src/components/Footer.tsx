import Brand from './Brand'

const copyrightYear = new Date().getFullYear()

export default function Footer() {
  return <footer className="bg-[#102e23] text-emerald-50">
    <div className="page-width grid gap-9 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.3fr]">
      <div><Brand light /><p className="mt-5 max-w-xs text-sm leading-7 text-emerald-100/75">Bringing farmers and buyers closer. A growing community for fresh produce and new possibilities.</p></div>
      <div><h2 className="font-semibold">Quick links</h2><ul className="mt-5 space-y-3 text-sm text-emerald-100/75"><li><a href="/">Home</a></li><li><a href="/marketplace">Marketplace</a></li><li><a href="/#sell">Sell Products</a></li><li><a href="/#about">How it works</a></li></ul></div>
      <div><h2 className="font-semibold">Categories</h2><ul className="mt-5 grid grid-cols-2 gap-3 text-sm text-emerald-100/75">{['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Seeds', 'Spices'].map(name => <li key={name}><a href={`/marketplace?category=${name.toLowerCase()}`}>{name}</a></li>)}</ul></div>
      <div id="help"><h2 className="font-semibold">Here to help</h2><p className="mt-5 text-sm leading-7 text-emerald-100/75">Support details will be available at launch.</p><p className="mt-3 text-xs text-emerald-100/60">Demo preview - No purchases or seller listings yet.</p></div>
    </div>
    <div className="page-width border-t border-white/15 py-6 text-xs text-emerald-100/65">&copy; {copyrightYear} FarmMarket. Smart Marketplace for Farmers.</div>
  </footer>
}
