-- Replace the default Tequila Sundays poster with this month's live music night.

update event_flyer set
  kicker = 'This month',
  title = 'Live Music',
  when_label = 'Thu 5–8pm · Fri & Sat 6–9pm',
  body = 'Melissa Marshall, Billy November, Trish Cleveland, Jade Alexis, Beth Tinnon, and Ellieanna. Live Thursday, Friday, and Saturday.',
  image_src = '/photos/live-music.jpg',
  cta_label = 'Reserve a Table',
  cta_href = '',
  published = true,
  updated_at = now()
where id = 1;
