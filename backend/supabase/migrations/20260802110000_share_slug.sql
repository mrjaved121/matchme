-- Public share slug for the "Share Profile" screen's link/QR code.
-- No public web viewer exists yet (frontend/dashboard don't serve one) —
-- this only backs the shareable link string and QR payload shown in-app.
alter table public.profiles
  add column share_slug text unique;
