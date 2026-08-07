-- Seed data is 154 profiles spread across 74 cities worldwide (~2 people
-- per city) -- with the old 50km default, a real user signing up from
-- almost any real-world location saw an empty Discover deck immediately,
-- since the odds of being within 50km of one of those 74 scattered cities
-- are near zero. Bumping the free-tier default to 500km actually gives
-- people something to see without touching Global Mode's value prop
-- (still the only way to match with zero distance limit at all, worldwide).
alter table public.profiles alter column max_distance_km set default 500;

-- Also bump anyone still sitting on the old default -- almost certainly
-- untouched preference, not a deliberate "exactly 50km" choice this early.
update public.profiles set max_distance_km = 500 where max_distance_km = 50;
