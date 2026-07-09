-- Create comment_reports table for flagging inappropriate comments
CREATE TABLE public.comment_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can report (via edge function)
CREATE POLICY "Service role can insert reports"
ON public.comment_reports
FOR INSERT
WITH CHECK (false);

-- Admins can view reports
CREATE POLICY "Admins can view reports"
ON public.comment_reports
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
ON public.comment_reports
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Prevent duplicate reports from same IP
CREATE UNIQUE INDEX idx_unique_report_per_ip ON public.comment_reports(comment_id, ip_hash);