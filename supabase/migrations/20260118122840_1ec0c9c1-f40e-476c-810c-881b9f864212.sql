-- Add avatar_url column to profiles table for reporter photos
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;