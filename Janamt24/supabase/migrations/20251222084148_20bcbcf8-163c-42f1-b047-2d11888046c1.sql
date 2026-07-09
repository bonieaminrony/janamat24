-- Create table to track unique news views
CREATE TABLE public.news_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
    session_id text NOT NULL,
    viewed_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(news_id, session_id)
);

-- Enable RLS
ALTER TABLE public.news_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their own view (but uniqueness constraint prevents duplicates)
CREATE POLICY "Anyone can record their view"
ON public.news_views
FOR INSERT
WITH CHECK (true);

-- Only allow selecting own views (prevent data mining)
CREATE POLICY "Users can view their own view records"
ON public.news_views
FOR SELECT
USING (false);

-- Replace the increment function with a safer version that checks for duplicate views
CREATE OR REPLACE FUNCTION public.increment_news_views(news_id uuid, session_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    effective_session_id text;
BEGIN
    -- Use provided session_id or generate one based on current timestamp
    effective_session_id := COALESCE(session_id, gen_random_uuid()::text);
    
    -- Try to insert a view record - if it already exists, do nothing
    INSERT INTO news_views (news_id, session_id)
    VALUES (increment_news_views.news_id, effective_session_id)
    ON CONFLICT (news_id, session_id) DO NOTHING;
    
    -- Only increment if a new view was recorded
    IF FOUND THEN
        UPDATE news 
        SET views = COALESCE(views, 0) + 1 
        WHERE id = increment_news_views.news_id AND status = 'published';
    END IF;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.increment_news_views(uuid, text) TO anon, authenticated;