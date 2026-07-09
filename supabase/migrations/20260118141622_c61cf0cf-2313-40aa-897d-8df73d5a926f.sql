-- Create a secure view that excludes ip_hash for public access
CREATE VIEW public.comments_public
WITH (security_invoker=on) AS
  SELECT 
    id, 
    news_id, 
    parent_id, 
    created_at, 
    display_name, 
    content
  FROM public.comments;

-- Drop the existing public SELECT policy on comments table
DROP POLICY IF EXISTS "Anyone can read comments for published news" ON public.comments;

-- Create a new restrictive policy that denies direct SELECT access to the comments table
-- This ensures ip_hash cannot be accessed directly
CREATE POLICY "No direct public access to comments"
  ON public.comments
  FOR SELECT
  USING (false);

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.comments_public TO anon;
GRANT SELECT ON public.comments_public TO authenticated;