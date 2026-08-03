-- Single profile prompt, shown as a quote card on the swipe deck (matches
-- the "My love language is..." card in the reference design). Keeping this
-- as one free-text field rather than a whole prompts system — the app has
-- no multi-prompt UI anywhere else and one field is enough for parity.
alter table public.profiles
  add column love_language text;
