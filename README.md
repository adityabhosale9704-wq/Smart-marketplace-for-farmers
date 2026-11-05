# Smart Marketplace for Farmers

A marketplace for buying and selling agricultural products. Phase 1 Step 4 includes a responsive FarmMarket homepage a searchable, filterable Marketplace, and Product Details pages using demonstration product listings.

## Stack

- HTML5, React, and TypeScript
- Vite for development and production builds
- Tailwind CSS with the official @tailwindcss/vite plugin
- React Router (react-router-dom), for Home, Marketplace, and a fallback Not Found route
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

src/assets, components, pages, layouts, routes, types, data, services, and hooks reserve space for future work. Empty directories contain .gitkeep files so Git can track them. The homepage is implemented at /. The Marketplace is available at /marketplace. Other feature pages are deferred.

Do not commit credentials or secrets. Environment files, dependencies, and build output are ignored. Only sanitized example environment files should be committed.


## Homepage preview

The homepage includes mobile navigation, category links to Marketplace, a search over the eight local sample products, product cards, an explanation of the planned buying and selling flow, and a seller invitation.

Product fixtures live in frontend/src/data/mockProducts.ts, with the Product contract in frontend/src/types/product.ts. Search matches product names, categories, locations, and sellers; homepage category links open the filtered Marketplace. View all products opens the Marketplace.

All listings, prices, quantities, seller names, and locations are demonstration data. No account creation, login, cart, checkout, ordering, messaging, seller registration, backend, or Supabase integration is implemented. Unavailable actions are marked coming soon. Unknown routes show a minimal Not Found screen.

Images use public Unsplash URLs and require internet access. Failed images show an accessible plant-themed fallback. External photographs are illustrative and do not verify a listed product or farm.


## Phase 1 Step 3: Marketplace

Open /marketplace to search local demonstration listings by product name, category, or seller. Search is case-insensitive and normalizes surrounding and repeated whitespace. Combine category, exact location, and optional minimum/maximum INR price filters. Category links use query parameters, for example /marketplace?category=vegetables; browser navigation restores the category selection.

Choose name or numeric price sorting in either direction. Prices are per listed unit (kg or quintal), so sorting does not compare equivalent quantities. Blank bounds are unrestricted; negative, non-finite, and reversed ranges display an error until corrected. Clear All Filters / Reset Filters clears search, category, location, price bounds, and restores name sorting.

The desktop sidebar becomes a collapsible filter panel on smaller screens. Product cards and image fallbacks are shared with the homepage. All eight listings remain mock data. No orders, checkout, authentication, backend, or Supabase integration is implemented.


## Phase 1 Step 4: Product Details

Product names on Home and Marketplace link to /products/:productId (for example /products/tomatoes). Details show the existing sample image, description, seller, location, price, unit, and stock. Invalid IDs and /products without an ID show Product Not Found.

Quantity starts at 1 for available products and changes in whole listed units. Minus stops at 1; plus stops at available stock. Unavailable products show 0 with both controls disabled. The estimated product subtotal is quantity multiplied by the listed unit price, excluding delivery, taxes, and other charges. Quintal listings explain that 1 quintal equals 100 kg.

The shared image fallback remains in use. Add to Cart is disabled and labelled Coming Soon; no cart state or purchases are created. Seller identities, descriptions, and stock are demonstration data with no verification or contact details.

Back to Marketplace restores the originating Marketplace filters and sorting using router navigation state. Category stays in the URL. Direct product links return to the default Marketplace. Filters are not stored as account preferences or persisted across independent sessions.

Manual checks: open /products/tomatoes and /products/rice, try quantity limits, use an invalid ID, and return from a filtered Marketplace listing.
