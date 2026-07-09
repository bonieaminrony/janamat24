-- Create table for tracking ad banner clicks
CREATE TABLE public.ad_banner_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_id UUID NOT NULL REFERENCES public.ad_banners(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  news_id UUID REFERENCES public.news(id) ON DELETE SET NULL,
  placement_type TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.ad_banner_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can record clicks (public tracking)
CREATE POLICY "Anyone can record ad clicks"
ON public.ad_banner_clicks
FOR INSERT
WITH CHECK (true);

-- Only admins can view click data
CREATE POLICY "Admins can view ad clicks"
ON public.ad_banner_clicks
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_ad_banner_clicks_banner_id ON public.ad_banner_clicks(banner_id);
CREATE INDEX idx_ad_banner_clicks_clicked_at ON public.ad_banner_clicks(clicked_at);