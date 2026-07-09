-- Fix increment_news_views to only increment for published articles
CREATE OR REPLACE FUNCTION public.increment_news_views(p_news_id uuid, p_session_id text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  view_exists boolean;
  is_published boolean;
BEGIN
  -- First check if the news article is published
  SELECT (status = 'published') INTO is_published 
  FROM news n WHERE n.id = p_news_id;
  
  -- Only proceed if the article is published
  IF NOT COALESCE(is_published, false) THEN
    RETURN;
  END IF;

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
  
  -- Increment the views counter (only for published articles)
  UPDATE news n SET views = COALESCE(n.views, 0) + 1 
  WHERE n.id = p_news_id 
    AND n.status = 'published';
END;
$function$;