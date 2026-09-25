-- Named photo slots for the public site. Missing rows fall back to
-- the defaults in src/lib/site-photos.ts.

create table if not exists site_photos (
  id          text primary key,
  src         text not null,
  alt         text not null default '',
  caption     text not null default '',
  updated_at  timestamptz not null default now()
);
