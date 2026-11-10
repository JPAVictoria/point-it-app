-- Image bucket for print-on-top layouts. Run once in the Supabase SQL Editor.
-- (Kept out of the Prisma migrations: it lives in Supabase's own `storage`
-- schema, which Prisma doesn't manage.)
--
-- Private, 5 MB per file, PNG/JPEG only (thumbnails are JPEG). No storage
-- policies: the server issues short-lived signed upload/download URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('layout-backgrounds', 'layout-backgrounds', false, 5242880, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;
