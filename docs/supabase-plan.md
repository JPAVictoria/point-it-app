# Plan: Persist layouts in Supabase

Status: **implemented — waiting on infrastructure setup** (see "Setup steps" at the bottom)

## Goal

Layouts survive refreshes and are available on any device, instead of living only in one
browser's `localStorage`. Work autosaves so nothing is lost when a tab closes. A shared
**Compilation** page shows everyone's layouts in one place.

## Decisions so far

| Topic | Decision |
|---|---|
| Login | **None.** Anyone who opens the app can use it; all layouts live in one shared workspace. |
| Hosting | **Vercel.** |
| What's stored | The **reference image** and the **text fields placed on the canvas** (plus the layout's name and page size, which are needed to put the text back in the right place). |
| Upload limit | **5 MB per image** (PNG/JPEG). Fits comfortably within the Supabase free tier. |
| Compilation | **A page listing every layout from everyone**, visible to all. |
| Existing browser layouts | **Start fresh.** Nothing is imported from `localStorage`. |
| oboda-app | **No integration.** It never reads this database; people keep exporting JSON. |

## Where things are today

| Concern | Today | Problem |
|---|---|---|
| Current layout | React state in `Editor.tsx` | Lost on refresh |
| Saved layouts | `localStorage` via `lib/print-on-top/storage.ts` | One browser only, ~5 MB total |
| Reference image | Base64 data URL inside the layout JSON | Bloats every save, fills the cap fast |
| Export | `[{ text, x, y }]` JSON download | Unchanged by this plan |

## Architecture

```
Browser (Editor)                         Vercel (Next.js server)                 Supabase
  edits ── debounced autosave ─────────►  Server Function saveLayout ─────────►  Postgres: layouts
  pick image ─► ask for upload URLs ────►  Server Function createImageUpload ──►  signed upload URLs
            └─► PUT image + thumbnail directly ────────────────────────────────►  Storage: layout-backgrounds
  open layout ◄── Server Component ◄────  reads row + signed image URL ◄───────
  /compilation ◄─ Server Component ◄────  lists rows + signed thumbnail URLs ◄─
```

**Why everything goes through the server (important without logins):** with no users, Supabase
can't tell callers apart, so any key shipped to the browser would let anyone read, overwrite,
or delete every layout directly. Instead:

- Only the server talks to the database: Prisma connects as the `postgres` role through
  Supabase's connection pooler (`DATABASE_URL`), and Storage uses the **service role key**.
  Both live in server-only modules (`import "server-only"`) and are never prefixed
  `NEXT_PUBLIC_`.
- Row Level Security is **on with no policies**, so the public anon key can do nothing even if
  it leaks. The service role bypasses RLS.
- The browser only gets what Server Functions return, and Server Functions validate their input
  (shape, sizes, file type) since — per the Next 16 docs — they're reachable by direct POST.

**Why images upload straight to Storage:** Vercel Functions reject request bodies over 4.5 MB,
so a 5 MB image can't pass through our server. The server issues a short-lived **signed upload
URL** (checking type and declared size first) and the browser uploads to Storage with it.

## Schema

Defined in `prisma/schema.prisma`; the migration is
`prisma/migrations/20261111000000_create_layouts/migration.sql` (generated offline with
`prisma migrate diff`, plus a hand-added `ENABLE ROW LEVEL SECURITY`). **You apply it** with
`npm run db:migrate`. Equivalent SQL for reference:

```sql
create table public.layouts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  page        jsonb not null,                 -- { widthPt, heightPt, displayUnit, orientation }
  fields      jsonb not null default '[]',    -- the text fields placed on the canvas
  background  jsonb,                          -- { storagePath, thumbnailPath, naturalWidthPx, naturalHeightPx, fitMode, frame? }
  author_name text check (char_length(author_name) <= 60),  -- optional, see "Author name" below
  version     integer not null default 1,     -- conflict detection, see Autosave
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz                     -- soft delete; lists filter `deleted_at is null`
);

create index layouts_recent_idx on public.layouts (updated_at desc) where deleted_at is null;
-- Name search uses ILIKE; fine at this scale without a dedicated index.

alter table public.layouts enable row level security;
-- Intentionally no policies: only the server (Prisma, as the postgres role) may access this table.
```

Storage (`supabase/storage.sql`, run in the SQL Editor — Prisma doesn't manage Supabase's
`storage` schema): **private** bucket `layout-backgrounds`, max file size 5 MB, allowed types
`image/png, image/jpeg`. Objects at `{layout_id}/{uuid}.{ext}` plus a small
`{layout_id}/{uuid}.thumb.jpg`. Images are shown through short-lived signed URLs created by the
server.

**Thumbnails:** when an image is picked, the browser also makes a ~600 px wide JPEG copy
(typically 30–80 KB) and uploads it next to the original. The Compilation page loads only these.
Without them, a page of 24 layouts could download 100+ MB of full scans and burn through the
free tier's monthly bandwidth in a few visits. (Supabase's built-in image resizing is a paid
feature, so we make thumbnails ourselves.)

Deletes are soft (`deleted_at`) so an accidental or unwanted delete is recoverable from the
dashboard; the old image file is kept until a cleanup job (later, optional) removes it.

## Autosave

- Saves ~1.5 s after the last change; drags save on release, not on every move.
- Status next to the title: `Saving…` → `Saved` → `Offline – retrying` / `Save failed`.
- Each save sends the `version` it started from: `update ... where id = $1 and version = $2`,
  then bumps `version`. If nothing was updated, someone changed the layout in another tab or on
  another device → show "This layout was changed elsewhere — Reload / Overwrite" instead of
  silently replacing their work. (This matters more without logins: a shared workspace means
  two people can open the same layout.)
- Undo/redo stays in the browser; it just triggers another autosave.
- Leaving the page with an unsaved change → the browser's "Leave site?" prompt.

## Compilation page

Route `/compilation`; `/` redirects there. Server-rendered, so it's fast and needs no
client-side Supabase access.

```
┌──────────────────────────────────────────────────────────────────┐
│  Compilation                         [ Search layouts… ]  [+ New] │
│  42 layouts · sorted by last edited                               │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │                      │
│ │ thumbnail│ │ │ thumbnail│ │ │ (no image│ │   …                  │
│ │ + text   │ │ │ + text   │ │ │  yet)    │ │                      │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │                      │
│ IPCC Invoice │ Koken DR     │ Untitled     │                      │
│ IPCC SI · 14 fields · 2h ago · by Ana                              │
└──────────────┴──────────────┴──────────────┴──────────────────────┘
```

- **Card:** thumbnail with the layout's text drawn on top at the right positions (same
  coordinates as the editor, just scaled down), name, page size preset, field count, last
  edited, author name if given. Click → opens the editor.
- **Card menu:** Open, Duplicate (copies the row and image into a new layout — handy for
  starting from someone else's work), Delete (confirm; soft delete).
- **Search** by name, **sort** by last edited (default), name, or newest.
- **Pagination:** 24 per page.
- Empty state with a "Create your first layout" button.
- Editor toolbar gets a "← Compilation" link; the Layouts dialog shrinks to just JSON export,
  since saving is automatic.

## Phases

Each phase ships on its own, with its own commit(s).

**1 — Supabase wiring** (no visible change)
- Add `@supabase/supabase-js`; `lib/supabase/server.ts` (server-only service-role client).
- `.env.local.example` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Migration SQL file.

**2 — Saving and opening layouts**
- `lib/print-on-top/layout-repository.ts` (server-only): `listLayouts` (search, sort, page),
  `getLayout`, `createLayout`, `duplicateLayout`, `saveLayout` (versioned),
  `softDeleteLayout`. Replaces `storage.ts`, which is deleted along with the browser-saved
  layouts list.
- Server Functions wrapping it, with input validation.
- Routes: `/layouts/[id]` = the editor; "New layout" creates a row and opens it.

**3 — Compilation page**
- `/compilation` as described above (thumbnails come in phase 4; until then cards show the
  text positions on a blank page).

**4 — Images in Storage**
- Upload flow above, including the thumbnail; `BackgroundImage.dataUrl` becomes
  `storagePath` + `thumbnailPath`. The toolbar shows upload progress; the layout only switches
  to the new image once both files are stored, so autosave never saves a path to a file that
  doesn't exist. Files over 5 MB are rejected before uploading.

**5 — Autosave**
- Debounced save, status indicator, conflict prompt, leave-page warning.

## Supabase free tier — things to know

Check current numbers in the Supabase dashboard / pricing page; as of writing, roughly:

- **Database:** 500 MB — text-only rows are tiny, effectively unlimited for this app.
- **Storage:** 1 GB — about **200 images at the full 5 MB**, far more in practice (form scans
  are usually 0.5–2 MB).
- **Bandwidth:** 5 GB/month egress — opening a layout downloads its full image; browsing the
  Compilation page only downloads thumbnails.
- **Inactivity pause:** free projects pause after about a week with no requests. The first
  visit afterwards fails until the project is resumed in the dashboard. Fine for an internal
  tool; worth knowing so it isn't mistaken for a bug.

## Risks of having no login

- Anyone with the URL can view, edit, or delete any layout. Soft delete makes deletes
  recoverable; versioned saves stop silent overwrites. If this ever needs locking down
  without full accounts, a single shared passcode (env var, checked by `proxy.ts`) is a
  small add-on.
- Someone could fill the storage quota by uploading repeatedly. Low risk for an internal
  URL; a per-IP rate limit can be added later if needed.

## What you'll do manually

See **Setup steps** at the bottom. I don't run migrations or change the Supabase dashboard myself.

## Author name

Decided: the first time someone creates or duplicates a layout, the app asks "What's your
name?" (Skip is allowed), remembers it in that browser, and saves it on their layouts. The
Compilation header shows "Creating as Ana" with a way to change it. It's a label only — anyone
can type any name.

## Setup steps

The database is accessed with **Prisma 7** (`prisma/schema.prisma`, client generated into
`lib/generated/prisma`). Supabase is used for Postgres hosting and image Storage only.

1. **Create the project** at supabase.com (free tier). Save the database password. Pick a
   region close to your Vercel region.
2. **Connection strings:** click **Connect** (top bar) → **ORMs** tab → **Prisma**. Copy:
   - the **transaction pooler** URL (port **6543**) → `DATABASE_URL`
   - the **session pooler / direct** URL (port **5432**) → `DIRECT_URL`

   Replace `[YOUR-PASSWORD]` with the database password. If the snippet appends
   `?pgbouncer=true`, remove it (that flag is for Prisma's old engine; the `pg` driver used
   here doesn't need it).
3. **Storage keys:** Project Settings → **API Keys** → copy the Project URL into
   `SUPABASE_URL` and the **secret** key (`sb_secret_…`, or legacy `service_role`) into
   `SUPABASE_SERVICE_ROLE_KEY`.
4. **Local env:** `cp .env.local.example .env.local` and fill in all four values.
5. **Create the table:** `npm run db:migrate` (runs `prisma migrate deploy` with
   `DIRECT_URL`). Check with `npm run db:status`. Supabase → Table Editor should show
   `layouts`.
6. **Create the image bucket:** Supabase → SQL Editor → paste `supabase/storage.sql` → Run.
   Storage should show a private `layout-backgrounds` bucket.
7. **Restart `npm run dev`**, open `/compilation`, create a layout, upload an image, reload —
   the image and text should come back.
8. **Vercel:** import the GitHub repo (framework: Next.js, default build settings). Add all
   four variables for Production and Preview before the first deploy. `npm install` runs
   `prisma generate` automatically (postinstall), so no build-command changes are needed.
9. **Future schema changes:** edit `prisma/schema.prisma`, run
   `npx prisma migrate dev --create-only` to write a migration, review it, commit it, then
   `npm run db:migrate` against the database.
