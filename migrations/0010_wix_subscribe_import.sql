-- Subscribe form moved off the live Wix site (form Subscribe, one submission).
-- Consent was the form checkbox. Phone stored as 10 digits.

insert into subscribers (email, name, phone, consented_at, terms_version)
values (
  'gingdunk2@gmail.com',
  'Linda Fanrak',
  '2672660685',
  '2026-09-12 21:26:06+00',
  '2026-09-06'
)
on conflict (email) do update set
  name = excluded.name,
  phone = excluded.phone,
  consented_at = coalesce(subscribers.consented_at, excluded.consented_at),
  terms_version = case
    when subscribers.terms_version = '' then excluded.terms_version
    else subscribers.terms_version
  end;
