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
real photography exists.

## Hero videos

Dish clips live in `public/videos/<dish-slug>.mp4` and **are committed to the
repo**. They were gitignored at first, which meant the hero video played
locally and silently fell back to a still image on Vercel — the file was never
in the deployment.

To add one:

```bash
npm run video -- "E:/Works/DX media/V2.mp4" bun-bo-hue
npm run db:seed
```

The first command re-encodes to a web-ready loop; the second registers it. The
seed finds clips by filename, so the slug must match the dish exactly and no
code change is needed. A dish without a clip keeps its poster image.

The re-encode matters: source files carry an audio track the player never
unmutes and a bitrate meant for full-screen viewing. It strips the audio, caps
the bitrate and moves the MP4 index to the front so playback starts before the
download finishes. The supplied Phở Bò clip went from 4.6 MB to 1.5 MB.

Keep clips short and under ~3 MB. GitHub warns above 50 MB per file and refuses
above 100 MB; if the collection outgrows the repo, move to Vercel Blob and put
the URLs on `MenuItem.video` instead — nothing else has to change, the field
already accepts an absolute URL.

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

## Deploying to Vercel

1. Push this repository to GitHub and import it in Vercel. The framework is
   detected automatically; `npm run build` already runs `prisma generate`, which
   Vercel's build cache would otherwise skip.
2. Set these environment variables in the Vercel project (Production **and**
   Preview). Without `AUTH_SECRET` the app refuses to issue sessions — by
   design, since a fallback signing key would be forgeable by anyone reading
   the source.

   | Variable | Notes |
   | --- | --- |
   | `DATABASE_URL` | The **pooled** connection string. Serverless functions open many short-lived connections; the pooler is what makes that survivable. |
   | `DIRECT_URL` | The **direct** (non-pooled) endpoint. Migrations take an advisory lock that PgBouncer in transaction mode cannot hold. |
   | `AUTH_SECRET` | `openssl rand -base64 32`. Required. |
   | `NEXTAUTH_URL` | The deployed origin, e.g. `https://vietrice-restaurant.vercel.app`. |
   | `NEXT_PUBLIC_SITE_URL` | Same origin; used for absolute URLs and metadata. |

   Optional: `AI_PROVIDER` + `OPENAI_API_KEY` (otherwise the assistant runs in
   grounded demo mode), `RESEND_API_KEY` + `EMAIL_FROM`, Cloudinary/Blob keys.

3. Run migrations against the production database once, from your machine:
   `npm run db:deploy`, then `npm run db:seed` for the first admin user and the
   catalogue. Vercel's build does not run migrations, deliberately — a schema
   change should never be a side effect of a deploy.
4. Sign in at `/admin/login` and change the seeded password immediately at
   `/admin/settings`.

**If the database is shared with another project**, append `&schema=vietrice`
to both URLs. Prisma Migrate operates on the whole database, and without a
dedicated schema a reset can drop tables that belong to something else.

## Status

Working and verified against a live PostgreSQL database: production build
passes with zero errors; reservations and pickup orders persist through
serializable transactions with double-booking rejection; the trilingual admin
console (`/admin` plus orders, reservations, tables, menu, promotions, gallery,
guests, history, settings) manages every one of them with a full audit trail;
the public site reads the catalogue from the database, so admin edits reach
guests; auth uses hashed passwords, rate limiting and server-side checks on
every route; statutory pages are in place.

Known gaps: no payment provider is wired (orders are marked `UNPAID` and paid
at the counter); no email sending (`RESEND_API_KEY` is read but unused); admin
can edit dishes, photos and promotions but not create or delete them; new
bookings appear on a page refresh rather than in real time; and the seeded menu
holds 14 dishes across 10 categories — it needs the restaurant's real card.

The Impressum and Datenschutz pages are a working draft. Details only the
operator holds (company form, register number, VAT ID, managing director, DPO)
are left visibly blank as `[bitte ergänzen]` in `src/content/legal.ts`. German
law requires them to be accurate; fill them in and have a lawyer review before
going live.
