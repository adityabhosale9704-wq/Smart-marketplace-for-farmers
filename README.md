# Smart Marketplace for Farmers

A marketplace for buying and selling agricultural products. Phase 1 Step 7 includes a responsive FarmMarket homepage a searchable, filterable Marketplace, and Product Details pages using demonstration product listings.

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

All listings, prices, quantities, seller names, and locations are demonstration data. A local demonstration cart is available. No account creation, login, checkout, ordering, messaging, seller registration, backend, or Supabase integration is implemented. Unavailable actions are marked coming soon. Unknown routes show a minimal Not Found screen.

Images use public Unsplash URLs and require internet access. Failed images show an accessible plant-themed fallback. External photographs are illustrative and do not verify a listed product or farm.


## Phase 1 Step 3: Marketplace

Open /marketplace to search local demonstration listings by product name, category, or seller. Search is case-insensitive and normalizes surrounding and repeated whitespace. Combine category, exact location, and optional minimum/maximum INR price filters. Category links use query parameters, for example /marketplace?category=vegetables; browser navigation restores the category selection.

Choose name or numeric price sorting in either direction. Prices are per listed unit (kg or quintal), so sorting does not compare equivalent quantities. Blank bounds are unrestricted; negative, non-finite, and reversed ranges display an error until corrected. Clear All Filters / Reset Filters clears search, category, location, price bounds, and restores name sorting.

The desktop sidebar becomes a collapsible filter panel on smaller screens. Product cards and image fallbacks are shared with the homepage. All eight listings remain mock data. No orders, checkout, authentication, backend, or Supabase integration is implemented.


## Phase 1 Step 4: Product Details

Product names on Home and Marketplace link to /products/:productId (for example /products/tomatoes). Details show the existing sample image, description, seller, location, price, unit, and stock. Invalid IDs and /products without an ID show Product Not Found.

Quantity starts at 1 for available products and changes in whole listed units. Minus stops at 1; plus stops at available stock. Unavailable products show 0 with both controls disabled. The estimated product subtotal is quantity multiplied by the listed unit price, excluding delivery, taxes, and other charges. Quintal listings explain that 1 quintal equals 100 kg.

The shared image fallback remains in use. Add to Cart now adds the selected quantity to the local demonstration cart; checkout supports a demonstration review only. Seller identities, descriptions, and stock are demonstration data with no verification or contact details.

Back to Marketplace restores the originating Marketplace filters and sorting using router navigation state. Category stays in the URL. Direct product links return to the default Marketplace. Filters are not stored as account preferences or persisted across independent sessions.

Manual checks: open /products/tomatoes and /products/rice, try quantity limits, use an invalid ID, and return from a filtered Marketplace listing.


## Phase 1 Step 5: Local shopping cart

Open /cart or use the navbar cart badge. Product Details adds the selected whole-unit quantity. Repeat additions merge into one row, with quantities capped at the current mock stock. The cart supports quantity changes, removal, Clear Cart, an empty state, and estimated INR subtotals. Checkout opens a frontend-only delivery form and review; order placement is unavailable.

CartProvider owns shared cart state and useCart reads it from any component. Reducer actions run against the latest state, including rapid repeated updates. QuantitySelector uses unique accessible labels for multiple cart rows.

Only product IDs and quantities are saved under farmmarket.cart.v1 in browser localStorage. Refresh restores valid selections; unknown products, malformed entries, invalid quantities, and unavailable products are discarded. Duplicate saved rows are merged and stock reductions clamp quantities. Names, prices, and stock always come from current mockProducts, never saved client data. Invalid JSON or outdated shapes reset to an empty cart. Storage failures leave the in-memory cart usable and display a warning. Data is local to this browser and origin; it is not an account cart, is not synchronized between tabs, and may be cleared by the browser.

The badge sums selected listed-unit counts, not a combined physical weight. Each row identifies kg or quintal units. Subtotals exclude taxes, delivery, and other fees. Nothing reserves stock or creates an order. No sensitive data is stored.

Checks should cover duplicate additions, stock limits, invalid saved data, refresh, quantity changes, removal, clear/empty state, badge updates, and subtotals. Browser interaction and visual responsiveness should also be checked manually.

Run automated cart checks from frontend with npm.cmd run test:cart (or npm run test:cart where npm scripts are permitted). These checks exercise reducer actions, bounds, storage validation and failure handling, totals, accessible label uniqueness, and server-rendered pages. They do not replace manual browser checks for live clicks, badge updates, real refresh persistence, image loading failures, and responsive appearance.


## Phase 1 Step 6: Checkout demonstration

Open /checkout from a non-empty cart. An empty cart shows a Marketplace link and no delivery form. DeliveryForm uses controlled React inputs for contact and address information. Required fields, meaningful names, 10-digit Indian mobile numbers starting with 6-9, optional email format, six-digit nonzero-leading PIN codes, and reasonable field lengths are validated locally. Whitespace is trimmed; PIN format does not prove deliverability.

Review Details displays inline errors or a demonstration contact/address review. Edit Details keeps values editable. OrderSummary reads the current shared cart, groups items by existing seller name, and shows each price, quantity, unit, and estimated subtotal. It updates with cart changes; no combined shipment is assumed. Taxes, delivery, and fees remain unknown.

Delivery details exist only in temporary React state. The app does not log, transmit, or save them to localStorage, sessionStorage, or any API. Reloading or leaving checkout discards them. Use sample details; browser autofill behavior is controlled by the browser. Only the pre-existing non-sensitive cart selections persist.

No order placement, order ID, inventory change, cart clearing, payment, authentication, backend, or Supabase integration occurs. Order Placement Coming Soon is displayed in the review.


Run npm run test:checkout from frontend for focused validation, required/optional field, length, whitespace, empty-cart, multi-seller/mixed-unit summary, current-cart totals, rendered errors, and privacy-related source checks. Run npm run test:cart for cart and existing-page regression checks. Manual browser verification remains for Review/Edit clicks and focus, live cart changes during review, real reload clearing delivery values, browser autofill, and responsive appearance.


## Phase 1 Step 7: Authentication UI only

Routes /login, /register, and /forgot-password provide controlled forms in a shared FarmMarket layout. Navbar links now open these pages. A future farmer account supports both buying and selling, with no permanent Buyer/Seller role choice.

Auth validation checks required fields, reasonable names and lengths, email format, Indian 10-digit mobile numbers starting with 6-9, 12-128 character demo passwords, registration letter/number requirements, exact password confirmation, and a clearly marked demonstration acknowledgement. Passwords are not trimmed or altered. Frontend validation does not establish password security or authenticate anyone.

Password visibility toggles are keyboard-accessible and do not submit the form. Remember email is UI-only and saves nothing. The acknowledgement is not real terms acceptance. Valid submissions show neutral messages: login is not connected, no account was created, and no reset email was sent.

Form values remain in temporary component state. The app does not store, log, or transmit passwords or registration information. Leaving/reloading a page discards app form state; browser autofill/password-manager behavior is controlled by the user/browser. Use sample information and never a real password in these demo forms.

Real account creation, login, reset email delivery, Supabase Auth, JWT verification, authorization, protected pages, backend, and database work remain deferred. No fake users, sessions, tokens, or social-login buttons are created.


Run npm run test:auth from frontend for validation, error-focus helper, page rendering, password accessibility defaults, demo notices, privacy-related source checks, and existing-page rendering. Run npm run test:cart and npm run test:checkout for regressions. Manual browser checks remain for valid/invalid form submissions, neutral notices, show/hide interactions, keyboard focus, mobile navigation/layout, and page-leave/reset behavior.
