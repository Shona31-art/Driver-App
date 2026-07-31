-- Adds max carrying capacity to trucks. The "registration" column itself
-- is kept as-is (renaming it would touch every query that already selects
-- it) -- only the UI label changes to "Horse", the term the business
-- actually uses for a truck/tractor unit's registration plate.

alter table public.trucks add column max_capacity_tons numeric(6, 2);
