-- Restaurant booking inbox. Unowned rows (no user accounts).
-- Public server functions only INSERT. Listing requires a staff PIN.

create table if not exists reservations (
  id          serial primary key,
  name        text not null,
  email       text not null,
  phone       text not null default '',
  visit_date  date not null,
  visit_time  text not null,
  party       integer not null,
  notes       text not null default '',
  status      text not null default 'requested',
  created_at  timestamptz not null default now()
);

create index if not exists reservations_created_at_idx on reservations (created_at desc);

create table if not exists subscribers (
  id          serial primary key,
  email       text not null unique,
  name        text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists inquiries (
  id          serial primary key,
  name        text not null,
  email       text not null,
  topic       text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on inquiries (created_at desc);
