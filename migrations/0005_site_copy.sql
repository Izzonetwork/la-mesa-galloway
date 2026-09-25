-- Homepage copy the kitchen office can edit. Missing row falls back
-- to defaults in src/lib/site-copy.ts.

create table if not exists site_copy (
  id          integer primary key check (id = 1),
  payload     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

insert into site_copy (id, payload) values (1, '{}'::jsonb)
on conflict (id) do nothing;
