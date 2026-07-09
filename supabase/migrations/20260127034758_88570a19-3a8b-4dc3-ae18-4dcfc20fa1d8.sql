-- Add public read-only policy for profiles table
-- This allows anonymous users to view author profile information (name, bio, avatar, social links)
-- which is required for displaying author information on news articles and author pages

CREATE POLICY "Public can view author profiles"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);