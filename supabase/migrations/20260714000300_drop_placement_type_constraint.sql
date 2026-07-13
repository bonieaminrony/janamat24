-- Drop the placement_type check constraint to allow new placements like 'article_inline'
ALTER TABLE public.ad_banners DROP CONSTRAINT IF EXISTS ad_banners_placement_type_check;
