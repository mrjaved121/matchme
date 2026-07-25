-- Profile depth fields (relationship intent, orientation, vitals) and a
-- selfie-based photo verification flow (manual admin review, no third-party
-- liveness vendor — keeps this light and avoids a paid dependency).

alter table public.profiles
  add column looking_for text check (looking_for in ('casual', 'long_term', 'friends', 'not_sure')),
  add column orientation text,
  add column height_cm smallint check (height_cm is null or (height_cm between 100 and 250)),
  add column job_title text,
  add column education text,
  add column smokes text check (smokes in ('yes', 'no', 'sometimes')),
  add column drinks text check (drinks in ('yes', 'no', 'sometimes')),
  add column verification_status text not null default 'none'
    check (verification_status in ('none', 'pending', 'approved', 'rejected')),
  add column verification_photo_path text;

-- ============ STORAGE: verification-photos bucket ============
-- Private (unlike profile-photos): only the owner and admins can read a
-- verification selfie, everyone else is blocked by RLS.
insert into storage.buckets (id, name, public)
values ('verification-photos', 'verification-photos', false)
on conflict (id) do nothing;

create policy "verification_photos_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'verification-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "verification_photos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'verification-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "verification_photos_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'verification-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "verification_photos_admin_select"
  on storage.objects for select
  using (bucket_id = 'verification-photos' and public.is_admin());

-- Admin moderation needs to actually delete a reported profile photo's
-- storage object, not just hide the DB row — the existing owner-only delete
-- policy on profile-photos didn't cover that.
create policy "profile_photos_bucket_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'profile-photos' and public.is_admin());
