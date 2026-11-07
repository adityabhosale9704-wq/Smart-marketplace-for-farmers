# Smart Marketplace for Farmers

A marketplace for buying and selling agricultural products. Phase 1 Step 13 includes a responsive FarmMarket homepage a searchable, filterable Marketplace, and Product Details pages using demonstration product listings.

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


## Phase 1 Step 8: Public seller dashboard preview

Open /seller/dashboard or choose Sell Products in the Navbar. No login is required for this demonstration preview and no user is treated as authenticated. One future farmer account will support both buying and selling.

Separate typed mockSellerData describes five fictional listings from a single demonstration farm and eight SAMPLE orders. It does not assign Marketplace products to that farm. Dashboard counts derive from these arrays: 5 products, 3 active in-stock listings, 1 zero-stock listing, and 5 incoming (Pending/Confirmed) sample orders. Demonstration sales value is INR 1,560, computed only from Completed sample orders using listed unit prices; it is not real revenue and excludes delivery/fees.

Recent Products shows category, unit price, stock, and Active/Draft/Out of stock status. Recent Orders resolves product references and calculates illustrative amounts. Stock overview compares quantities with per-listing thresholds in their own units, including low-stock onions and zero-stock wheat. No inventory is changed or quantities combined across units.

Seller navigation is collapsible, with an Add Product preview form and My Products and Seller Orders navigation. No management pages, order processing, data persistence, backend, Supabase, authentication, sessions, or ownership enforcement are implemented. Real integration must identify the farmer and enforce authorization and ownership on the Express backend.


Run npm run test:seller from frontend for dashboard rendering, route/navigation destinations, derived statistics, low/zero stock, missing product references, empty datasets, and existing-page rendering. npm run test:auth, npm run test:cart, and npm run test:checkout remain regression checks. Manual visual checks remain for sidebar collapse, mobile/desktop appearance, keyboard use, navigation clicks, and overflow.


## Phase 1 Step 9: Add Product demonstration

/seller/add-product opens from the dashboard and seller sidebar. ProductForm uses existing categories and Product unit types (kg and quintal); no tonne unit is introduced into existing purchase/cart behavior. Fields cover name, description, category, unit, INR price, available stock, city, district, state, optional harvest date, and optional local image.

Validation requires a positive price, nonnegative stock, at most two decimal places, and numeric values no greater than 1,000,000. Exponent notation, NaN, Infinity, negatives, and excessive precision are rejected. Product name is 3-100 characters; description is 20-2000 characters. Locations require readable place names; no GPS or delivery-coverage claim is made. Harvest dates must be real dates from 1900 through the current date in Asia/Kolkata. Stock is available listing quantity, not an order quantity.

JPG, PNG, and WebP images up to 5 MB are decoded locally to detect corrupt files. Images can be replaced or removed. Blob URLs are revoked on replacement, removal, failed/stale decoding, and leaving the page. The accepted image survives switching between form and preview, but nothing is uploaded or stored in localStorage.

Preview Product validates the form and shows an editable review: Demonstration preview only. The product has not been saved or published. No product ID, seller identity, mock catalogue insertion, inventory update, account, or backend request is created. Form state and images disappear when the page is left or reloaded.

Run npm run test:product-form from frontend for focused form validation/rendering, image MIME/size restrictions, preview content, edit handler, and privacy-related source checks. Real file decoding and object-URL lifecycle, Preview/Edit interaction, focus, and responsive appearance still require manual browser testing.


## Phase 1 Step 10: My Products demonstration

Open /seller/products from the seller sidebar. My Products clones the existing fictional seller listings into temporary page state. It is independent of buyer Marketplace mockProducts and unsaved Add Product previews. Leaving or refreshing resets edits; the dashboard continues to show the original sample data.

Search ignores case, surrounding whitespace, and repeated spaces. Combine name search with existing category and listing-status filters; Clear Filters resets all three. Statistics count all current page listings, not just filtered results, and update after edits.

View / Edit opens an inline, keyboard-accessible editor. Edit name, positive INR unit price, nonnegative stock, and demonstration status. Price/stock support two decimals and a maximum of 1,000,000. Units and IDs cannot be changed. Active requires positive stock; Out of Stock requires zero stock; Draft supports either. Draft takes precedence over stock for listing status; zero/low stock warnings still reflect quantity. Shared status calculations/badges keep recent dashboard products and management consistent.

Apply Demo Changes changes only this page and explicitly says nothing was saved or published. Filters remain active, so an edited row may disappear from results. Cancel or Escape closes the editor without applying changes. No deletion, publishing, inventory API, backend persistence, authentication, or ownership checks are implemented.

Run npm run test:my-products from frontend for filtering, validation, stock/status consistency, updated counts, immutable source data/units, empty results, and page/editor rendering. Manual checks remain for actual editing, cancel/Escape, focus, filter/reset controls, live statistics, and mobile/desktop appearance.


## Phase 1 Step 11: Seller Orders demonstration

/seller/orders opens from the seller sidebar and dashboard Recent Orders link. Eight fictional SAMPLE orders contain only line snapshots from the isolated demonstration farm. Buyer display names are explicitly Sample Buyer A-H; delivery locations use only city/state and non-personal sample instructions. No real contact details, authentication, or actual orders are involved.

Order lines capture product name, listing reference, quantity, unit, and unit price. Line estimates equal quantity multiplied by unit price, rounded to paise; seller-specific subtotals sum line estimates. kg and quintal are displayed separately, without adding their quantities. Shipping, taxes, fees, final payable amounts, and payment confirmations are not invented. Snapshots remain readable if a listing is later absent; frontend data selection does not provide authorization.

Search matches reference, fictional buyer, or product name, ignoring case and unnecessary whitespace. Combine search with a status filter or Clear Filters. Statistics derive from all current page records: initially 8 total, 3 Pending, 2 Confirmed, 2 Completed, and 1 Cancelled.

View Details opens an inline accessible panel with Close Details and Escape support. Permitted temporary transitions: Pending to Confirmed or Cancelled; Confirmed to Completed or Cancelled. Completed and Cancelled are final. Transition validation uses the latest React state. Counts and the selected details update together; filters remain active, so an updated row may stop matching.

Changes exist only on Seller Orders and reset when leaving/reloading. Dashboard figures remain the original seeded examples. Nothing is saved, cancelled, fulfilled, deducted from inventory, charged, sent, or notified outside this temporary UI. One future farmer account supports both buying and selling. Real Express endpoints must verify identity, ownership, and transitions.

Run npm run test:seller-orders from frontend for fixtures, filtering, calculations, transitions, counts, details rendering, and source-data isolation. Existing test scripts remain regression checks. Manual browser verification remains for live interactions, keyboard/focus behavior, responsive presentation, and real refresh reset.


## Phase 1 Step 12: My Orders / buyer history preview

/my-orders is a public, unauthenticated demonstration linked from desktop and mobile Navbar as My Orders (Demo). Seven separate SAMPLE-BUY records are fictional fixtures, not purchases created by Checkout, the cart, or seller status updates. No contact details, private addresses, payment confirmations, shipment dates, or tracking numbers are included.

BuyerOrder groups snapshots into seller fulfillments. Product references and units follow the existing Product type; seller statuses reuse the existing Pending/Confirmed/Completed/Cancelled vocabulary. Two examples contain separate fictional growers with different statuses. Mixed is an overall summary only; each seller retains its individual state. Uniform-status filters match purchases where every seller has that status; Mixed matches different seller statuses.

Totals derive from quantity times unit price, rounded to paise, summed across lines and sellers. Each quantity retains kg or quintal units; no combined weight or final payable total is shown. Shipping, taxes, and additional fees are unknown. Initial counts: 7 total, 3 with at least one Pending/Confirmed seller, and 2 with every seller Completed. Cancelled and Mixed terminal examples mean these statistics are not a complete partition of total orders.

Search matches reference, product, or fictional grower name, ignoring case and unnecessary whitespace. Clear Filters resets search/status. View Details uses /my-orders?order=SAMPLE-BUY-004 so Back/Forward and direct preview links work. Invalid or blank order references display a useful not-found state; no seed orders produces an empty state. Close Details and Escape remove the reference and return focus where practical.

OrderProgress shows only the sample status vocabulary and marks the current example step; other steps are explicitly path illustrations, not confirmed past/future events. Cancelled shows a separate message without a successful-completion path. Multi-seller progress is displayed separately.

No history records or statuses are editable here. No order creation, authentication, persistent history, database, tracking, inventory, payment, backend, or Supabase integration is implemented. One future farmer account supports both roles. Future Express APIs must enforce buyer and seller ownership; frontend filtering is not security.

Run npm run test:buyer-orders from frontend for fixtures, isolation, search/status filters, empty/not-found states, details/units, mixed statuses, progress, and calculations. Existing scripts remain regression checks. Manual checks remain for actual filter/reset/detail interactions, keyboard/focus, browser Back/Forward, responsive appearance, and reload behavior.


## Phase 1 Step 13: Public farmer profile preview

/profile is accessible through the Profile (Demo) navbar icon and mobile link. It shows a fictional Sample Farmer profile with farmer@example.com, a sample village/district, Maharashtra, a format-only PIN, and a masked 9XXXXXXXXX mobile placeholder. No real phone number is seeded; the optional editable mobile field starts blank. No authenticated user ID or session is represented.

Edit Profile opens a separate controlled draft. Validation checks required names/email/locations/PIN, reasonable lengths, optional Indian 10-digit mobile format, email format, and a six-digit nonzero-leading PIN. Name and location whitespace is normalized. These checks do not establish identity, phone/address ownership, or deliverability.

Save Demo Changes updates the displayed React state and says: Demo profile updated on this page only. No account information was saved. Cancel or Escape discards the draft without changing displayed values. Reopening the form starts from the current displayed profile; leaving/reloading restores the original fixture.

Buying links open Marketplace, Cart, and My Orders. Selling links open Seller Dashboard, Add Product, My Products, and Seller Orders. This is one future farmer account, without role selection or separate buyer/seller accounts. Change Password, Account Security, and Logout remain disabled Coming Soon placeholders. Login/Register remain visible; no logged-in menu, verified badge, or fake logout is introduced.

Profile values stay in component memory only. The app does not log, transmit, or store them in browser storage/cookies, database, or external services. Use fictional details. Browser autofill/password-manager behavior is controlled by the user/browser, not app persistence. Future Supabase Auth must supply the real identity, Express must verify JWTs and ownership/permissions, and PostgreSQL must store profiles linked to the authenticated identity. None are integrated here.

Run npm run test:profile from frontend for fixtures, validation, normalization, immutable state values, rendered form/card, navigation links, disabled settings, and privacy-related source checks. Existing verification scripts remain regression checks. Manual testing remains for actual Edit/Save/Cancel/Escape, inline errors/focus, card updates, reload reset, responsive appearance, and autofill.
