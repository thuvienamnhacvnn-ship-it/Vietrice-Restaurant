# VIET RICE — Vietnamesisches Restaurant & Sushi Berlin

Luxury restaurant web app: hero showcase, smart table reservation, 3D smart menu,
takeaway ordering, promotions, gallery and a grounded AI Chef Assistant.

- **Address** Otto-Weidt-Platz 11, 10557 Berlin, Germany
- **Phone** 030 55476585 · **Email** info@vietrice-restaurant.de
- **Web** vietrice-restaurant.de

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 3 ·
Framer Motion · Prisma 6 + PostgreSQL · Zod · React Hook Form · Zustand ·
Lucide Icons · bcryptjs

## Quick start

```bash
npm install
cp .env.example .env          # then fill in the values
npm run assets                # extract images from the design mockups
npm run db:migrate            # create the schema (needs DATABASE_URL)
npm run db:seed               # seed menu, tables, promotions, gallery, admin
npm run dev                   # http://localhost:3000
```

The public site renders **without a database**: every section falls back to the
shared content modules in `src/content/`. Reservations validate but are not
persisted until `DATABASE_URL` is set — the API says so explicitly in its
response rather than pretending the booking was stored.

## Setup, step by step

1. **Install dependencies** — `npm install`
2. **Create a database** — any PostgreSQL 14+ (Neon, Supabase, Vercel Postgres,
   or local). Put the connection string in `DATABASE_URL`.
3. **Migrate** — `npm run db:migrate` (dev) or `npm run db:deploy` (production)
4. **Seed** — `npm run db:seed`
5. **Run locally** — `npm run dev`
6. **Create an admin** — set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
   (min. 10 chars) in `.env` before seeding. The seed upserts a `SUPER_ADMIN`.
   Change the password after the first login. Credentials are never hard-coded
   in the frontend.
7. **Configure AI** — leave `AI_PROVIDER` empty for the grounded demo mode.
   The UI labels demo answers explicitly. Set `AI_PROVIDER=openai` plus
   `OPENAI_API_KEY` once the hosted-model grounding layer is wired.
8. **Configure email** — set `RESEND_API_KEY` and `EMAIL_FROM` for booking
   acknowledgements and newsletter double opt-in.
9. **Google Map** — no key needed. The footer uses Google's keyless embed and
   falls back to an outbound link if the iframe is blocked. Never expose a Maps
   key with a `NEXT_PUBLIC_` prefix.
10. **Deploy to Vercel** — import the repo, set the env vars from
    `.env.example`, and let the build run `prisma generate && next build`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run assets` | Re-extract images from the design mockups |
| `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Prisma |

## Images

There was no photo library — the brief supplied **six 1672×941 full-page design
mockups plus one logo SVG**. `scripts/extract-assets.mjs` cuts every real
photograph out of those frames into `public/images`, keyed by crop rectangles in
the mockups' own coordinate space.

Two things that script deliberately handles:

- **Crops exclude baked-in UI.** The mockups draw their own social rail, AI-Chef
  widget and headline overlays *into* the artwork. Crop bounds stop short of
  them so those elements don't appear twice (once as pixels, once as live DOM).
- **Ingredient sprites are alpha-keyed.** Luminance maps to transparency, so the
  near-black mockup background drops out and generous crop bounds stay safe.

Re-run with a different source folder:

```bash
SOURCE_DIR="D:\path\to\mockups" npm run assets
```

**Known limitation:** only Phở Bò exists at full resolution in the mockups. The
other seven hero backdrops are upscaled, deliberately softened derivatives of
their ~191×128 carousel thumbnails. Replace `MenuItem.poster` via Admin once
real photography exists. No dish videos were supplied either — `MenuItem.video`
is null and `VideoBackground` falls back to the poster image.

## Architecture notes

- **Content layer** — `src/content/*` is the single source of truth shared by
  `prisma/seed.ts` and the no-database fallback, so the two cannot drift.
  Components receive data as props and never import it directly.
- **i18n** — DE (default) / EN / VI. Routes are not locale-prefixed; a cookie
  holds the preference. `Dictionary` is derived from the German dictionary, so a
  missing key in `en`/`vi` is a compile error, not a runtime fallback.
- **Server time is authoritative.** Promotion validity, table availability and
  every countdown are anchored to the server clock. A visitor cannot resurrect
  an expired promotion or free a busy table by changing their system clock.
- **Booking conflicts** use the half-open rule
  `newStart < existingEnd && newEnd > existingStart`, checked server-side, so
  back-to-back seatings are allowed but overlaps are not.
- **16:9 sections** — `SectionFrame` pins each desktop section to the mockups'
  16:9 canvas and drops the ratio below `lg`.
- **3D ingredient layer** — built from alpha-keyed PNGs on real CSS 3D
  transforms with pointer parallax (`DishShowcase3D`), not WebGL. The design
  assets ship no GLB/GLTF models, and this keeps the page smooth on mobile. The
  WebGL upgrade path needs `@react-three/fiber` v9 + `@react-three/drei` v10
  (the React 19 line that Next 15 runs).
- **Countdowns share one 1 Hz ticker** that pauses on hidden tabs — twelve
  independent intervals on the floor plan pegged the main thread.
- **Accessibility** — semantic landmarks, keyboard-navigable floor plan and
  carousel (radio-group semantics), visible focus rings, ARIA labels, and full
  `prefers-reduced-motion` support that drops the 3D layer entirely.

## Status

Working and verified: production build (`npm run build`) passes with zero
errors across all 10 routes; hero with dish-switching carousel; 12-table
reservation floor plan with live countdowns and Zod-validated booking modal;
smart menu with 3D ingredient parallax and takeaway cart; promotions with
server-time countdown; gallery with lightbox; AI assistant in grounded demo
mode; footer with live Google Map.

Not yet built: the `/admin` area, the order checkout flow, and database
persistence for reservations/orders (schema, migrations and seed are in place;
the API routes validate fully and are marked where the Prisma transaction goes).
