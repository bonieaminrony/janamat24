-- Add bio column to profiles table for author information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Add index for faster author lookups in news
CREATE INDEX IF NOT EXISTS idx_news_author_id ON public.news(author_id);