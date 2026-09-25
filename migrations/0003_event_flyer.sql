-- Single promotional flyer. Staff PIN updates this row; the public site
-- only renders it when published is true.

create table if not exists event_flyer (
  id          integer primary key check (id = 1),
  kicker      text not null default 'This week',
  title       text not null,
  when_label  text not null default '',
  body        text not null default '',
  image_src   text not null,
  cta_label   text not null default 'Reserve a Table',
  cta_href    text not null default '',
  published   boolean not null default true,
  updated_at  timestamptz not null default now()
);

insert into event_flyer (
  id, kicker, title, when_label, body, image_src, cta_label, cta_href, published
) values (
  1,
  'Happening now',
  'Tequila Sundays',
  'Every Sunday · 3–9pm',
  'Built around the tequila list. Pull up, sip slow, stay for dinner.',
  '/photos/tequila-wall.jpg',
  'Reserve a Table',
  '',
  true
) on conflict (id) do nothing;
