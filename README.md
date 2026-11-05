# Smart Marketplace for Farmers

A marketplace for buying and selling agricultural products. Phase 1 Step 2 provides a responsive FarmMarket homepage with demonstration product listings.

## Stack

- HTML5, React, and TypeScript
- Vite for development and production builds
- Tailwind CSS with the official @tailwindcss/vite plugin
- React Router (react-router-dom), for the homepage and a fallback Not Found route
- Lucide React icons

Planned backend: Node.js and Express.js. Planned database and authentication: Supabase PostgreSQL, Supabase Auth, and JWT. None are integrated yet.

## Frontend commands

From the Ecommerce workspace root:

```sh
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite. Stop the server with Ctrl+C.

```sh
npm run build
npm run lint
npm run preview
```

Build output is written to frontend/dist. Lint uses the checker supplied by the Vite template. If Windows PowerShell blocks npm scripts, use npm.cmd in the commands above.

## Source structure

src/assets, components, pages, layouts, routes, types, data, services, and hooks reserve space for future work. Empty directories contain .gitkeep files so Git can track them. The homepage is implemented at /. Other feature pages are deferred.

Do not commit credentials or secrets. Environment files, dependencies, and build output are ignored. Only sanitized example environment files should be committed.


## Homepage preview

The homepage includes mobile navigation, category filters, a search over the eight local sample products, product cards, an explanation of the planned buying and selling flow, and a seller invitation.

Product fixtures live in frontend/src/data/mockProducts.ts, with the Product contract in frontend/src/types/product.ts. Search matches product names, categories, locations, and sellers; category selection combines with search. View all products clears both filters.

All listings, prices, quantities, seller names, and locations are demonstration data. No account creation, login, cart, checkout, ordering, messaging, seller registration, backend, or Supabase integration is implemented. Unavailable actions are marked coming soon. Unknown routes show a minimal Not Found screen.

Images use public Unsplash URLs and require internet access. Failed images show an accessible plant-themed fallback. External photographs are illustrative and do not verify a listed product or farm.
