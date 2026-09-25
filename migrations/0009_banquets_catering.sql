-- Headline and body: banquets, private parties, and catering.

update site_copy
set payload = jsonb_set(
      jsonb_set(
        coalesce(payload, '{}'::jsonb),
        '{banquetHeadline}',
        '"Banquets, private parties, and catering."'::jsonb
      ),
      '{banquetBody}',
      '"Birthdays, office dinners, catering, and private events in the dining room. Groups of up to 30. Reserve tables on OpenTable, or call us for a larger buyout."'::jsonb
    ),
    updated_at = now()
where id = 1;
