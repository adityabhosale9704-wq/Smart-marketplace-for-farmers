import { CircleCheck } from 'lucide-react'

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-16 text-stone-900">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Smart Marketplace for Farmers
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Buy and sell agricultural products in one place
        </p>
        <section aria-labelledby="setup-heading" className="mt-8 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-700">
            <CircleCheck aria-hidden="true" className="size-6 shrink-0" />
            <h2 id="setup-heading" className="text-lg font-semibold">Frontend setup complete</h2>
          </div>
          <p className="mt-3 text-stone-600">
            React, TypeScript, Vite, and Tailwind CSS are ready for development.
          </p>
        </section>
      </div>
    </main>
  )
}

export default App
