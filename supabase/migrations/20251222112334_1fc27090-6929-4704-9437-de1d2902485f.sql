-- Drop and recreate the increment_news_views function with proper parameter naming
DROP FUNCTION IF EXISTS public.increment_news_views(uuid, text);
DROP FUNCTION IF EXISTS public.increment_news_views(uuid);

CREATE OR REPLACE FUNCTION public.increment_news_views(p_news_id uuid, p_session_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  view_exists boolean;
BEGIN
  -- Check if this session already viewed this news (if session_id provided)
  IF p_session_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM news_views nv 
      WHERE nv.news_id = p_news_id 
      AND nv.session_id = p_session_id
    ) INTO view_exists;
    
    IF view_exists THEN
      RETURN;
    END IF;
    
    -- Insert new view record
    INSERT INTO news_views (news_id, session_id)
    VALUES (p_news_id, p_session_id);
  END IF;
  
  -- Increment the views counter
  UPDATE news n SET views = COALESCE(n.views, 0) + 1 WHERE n.id = p_news_id;
END;
$$;