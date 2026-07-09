-- Drop existing comment tables (they require auth)
DROP TABLE IF EXISTS public.comment_reactions CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;

-- Create new anonymous comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  display_name TEXT,
  content TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments on published news
CREATE POLICY "Anyone can view comments"
ON public.comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.news 
    WHERE news.id = comments.news_id 
    AND news.status = 'published'
  )
);

-- Only edge function (service role) can insert
CREATE POLICY "Service role can insert comments"
ON public.comments
FOR INSERT
WITH CHECK (false);

-- Only admins can delete comments
CREATE POLICY "Admins can delete comments"
ON public.comments
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- No updates allowed
CREATE POLICY "No updates to comments"
ON public.comments
FOR UPDATE
USING (false);

-- Create index for faster queries
CREATE INDEX idx_comments_news_id ON public.comments(news_id);
CREATE INDEX idx_comments_ip_hash ON public.comments(ip_hash);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;