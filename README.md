# Smart Marketplace for Farmers

A marketplace for buying and selling agricultural products. Phase 1 provides only the frontend foundation and a setup confirmation screen.

## Stack

- HTML5, React, and TypeScript
- Vite for development and production builds
- Tailwind CSS with the official @tailwindcss/vite plugin
- React Router (react-router-dom), installed for future routing
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

src/assets, components, pages, layouts, routes, types, data, services, and hooks reserve space for future work. Empty directories contain .gitkeep files so Git can track them. Feature pages and routing are deferred.

Do not commit credentials or secrets. Environment files, dependencies, and build output are ignored. Only sanitized example environment files should be committed.
