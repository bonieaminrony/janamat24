-- Create reporter_activity table to track login and activity
CREATE TABLE public.reporter_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'login', 'news_created', 'news_updated', 'news_deleted'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_reporter_activity_user_id ON public.reporter_activity(user_id);
CREATE INDEX idx_reporter_activity_created_at ON public.reporter_activity(created_at DESC);

-- Enable RLS
ALTER TABLE public.reporter_activity ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
ON public.reporter_activity
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Admins can insert activity
CREATE POLICY "Admins can insert activity"
ON public.reporter_activity
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

-- System can insert activity (for login tracking via edge function)
CREATE POLICY "Service role can insert activity"
ON public.reporter_activity
FOR INSERT
WITH CHECK (true);

-- Add last_login column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;