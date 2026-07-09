-- Fix overly permissive RLS policies for INSERT operations

-- 1. Drop and recreate news_views INSERT policy with proper validation
DROP POLICY IF EXISTS "Anyone can record their view" ON public.news_views;

CREATE POLICY "Anyone can record views for published articles"
ON public.news_views
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.news 
    WHERE news.id = news_id 
    AND news.status = 'published'
  )
);

-- 2. Drop and recreate ad_banner_clicks INSERT policy with proper validation
DROP POLICY IF EXISTS "Anyone can record ad clicks" ON public.ad_banner_clicks;

CREATE POLICY "Anyone can record clicks for active banners"
ON public.ad_banner_clicks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ad_banners 
    WHERE ad_banners.id = banner_id 
    AND ad_banners.is_active = true
  )
);