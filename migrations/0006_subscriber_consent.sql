-- Phone and written consent on the public subscribe form.

alter table subscribers add column if not exists phone text not null default '';
alter table subscribers add column if not exists consented_at timestamptz;
alter table subscribers add column if not exists terms_version text not null default '';
