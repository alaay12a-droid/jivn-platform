# چڤن — منصة تطبيقات المطاعم

منصة عربية RTL تساعد المطاعم على إطلاق تطبيقات جوال وقنوات طلب رقمية تحمل هويتها.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server on its configured port
- `pnpm --filter @workspace/jivn-website run dev` — run the Arabic RTL web app
- `pnpm --filter @workspace/jivn-website run typecheck` — typecheck the frontend
- `pnpm --filter @workspace/api-server run typecheck` — typecheck the API
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes to development
- Required runtime services: PostgreSQL, Clerk, and Replit Object Storage

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/jivn-website/src/App.tsx` — public landing page, enquiry dialog, and authenticated admin UI
- `artifacts/jivn-website/src/index.css` — shared Arabic RTL visual system and responsive styles
- `artifacts/api-server/src/routes/` — public, lead, admin, storage, and seed routes
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/` — Drizzle/PostgreSQL schema modules
- `lib/object-storage-web/` — browser upload helper for restaurant logos
- Website content, announcement notifications, and uploaded media are managed from the admin tabs and persisted through the API.
- The homepage includes a persisted marketing order counter with a small server-calculated daily cadence and a viewport-triggered client count-up animation.
- Public navigation does not expose an admin link; the admin area is opened from four rapid presses on the Jivn logo and verified by a server-only unlock secret.

## Architecture decisions

- The public site is a React/Vite artifact backed by a separate Express API so content and leads persist across refreshes.
- Clerk owns sign-in/sign-up and session state; `/admin` and all admin API routes require a Clerk session.
- Public data is served from PostgreSQL and initialized through a concurrency-safe, idempotent seed routine.
- Restaurant logo uploads use Replit Object Storage rather than storing binary files in PostgreSQL.
- Site notifications and media metadata live in PostgreSQL; image bytes live in Replit Object Storage.
- Marketing counter settings and its baseline value live in PostgreSQL; the public API exposes only its displayed value and enabled state.
- Admin unlock uses an HttpOnly, signed cookie backed by `SESSION_SECRET`; the unlock code is stored only in Replit Secrets.
- API hooks and request schemas are generated from the OpenAPI contract; update the contract before regenerating clients.

## Product

- Arabic RTL premium landing page for restaurant app development.
- Dynamic pricing cards, restaurant-logo carousel, WhatsApp/email contact actions, and lead enquiry form.
- Admin workspace for editing site copy, contact settings, pricing plans, restaurant logos, and lead statuses.

## User preferences

- Use the brand name `چڤن` in the interface and communication.

## Gotchas

- The frontend Vite config requires `PORT` and `BASE_PATH` when running a standalone build.
- Keep the generated API clients synchronized after changing `lib/api-spec/openapi.yaml`.
- Use Clerk cookies for browser API calls; do not add a browser bearer-token getter.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
