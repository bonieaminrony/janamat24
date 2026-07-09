-- Create a secure function to increment news views without requiring authentication
CREATE OR REPLACE FUNCTION public.increment_news_views(news_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE news 
  SET views = COALESCE(views, 0) + 1 
  WHERE id = news_id AND status = 'published';
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.increment_news_views(UUID) TO anon, authenticated;