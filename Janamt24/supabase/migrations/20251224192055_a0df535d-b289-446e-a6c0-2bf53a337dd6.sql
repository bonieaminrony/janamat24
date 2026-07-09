-- Create ad_partners table for storing company information
CREATE TABLE public.ad_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_banners table for different banner sizes per partner
CREATE TABLE public.ad_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.ad_partners(id) ON DELETE CASCADE,
  placement_type TEXT NOT NULL CHECK (placement_type IN ('header', 'sidebar', 'in_article', 'footer')),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for news-partner relationship
CREATE TABLE public.news_ad_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.ad_partners(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(news_id, partner_id)
);

-- Enable RLS on all tables
ALTER TABLE public.ad_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_ad_partners ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_partners
CREATE POLICY "Anyone can view active ad partners"
ON public.ad_partners FOR SELECT
USING (is_active = true OR (auth.uid() IS NOT NULL AND is_admin_or_editor(auth.uid())));

CREATE POLICY "Admin/Editor can insert ad partners"
ON public.ad_partners FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can update ad partners"
ON public.ad_partners FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can delete ad partners"
ON public.ad_partners FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- RLS policies for ad_banners
CREATE POLICY "Anyone can view active banners"
ON public.ad_banners FOR SELECT
USING (is_active = true OR (auth.uid() IS NOT NULL AND is_admin_or_editor(auth.uid())));

CREATE POLICY "Admin/Editor can insert banners"
ON public.ad_banners FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can update banners"
ON public.ad_banners FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can delete banners"
ON public.ad_banners FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- RLS policies for news_ad_partners
CREATE POLICY "Anyone can view news ad partners"
ON public.news_ad_partners FOR SELECT
USING (true);

CREATE POLICY "Admin/Editor can insert news ad partners"
ON public.news_ad_partners FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can update news ad partners"
ON public.news_ad_partners FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can delete news ad partners"
ON public.news_ad_partners FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Create storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-images', 'ad-images', true);

-- Storage policies for ad-images bucket
CREATE POLICY "Anyone can view ad images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ad-images');

CREATE POLICY "Admin/Editor can upload ad images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ad-images' AND is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can update ad images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ad-images' AND is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can delete ad images"
ON storage.objects FOR DELETE
USING (bucket_id = 'ad-images' AND is_admin_or_editor(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_ad_partners_updated_at
  BEFORE UPDATE ON public.ad_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_banners_updated_at
  BEFORE UPDATE ON public.ad_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ad_banners_partner_id ON public.ad_banners(partner_id);
CREATE INDEX idx_ad_banners_placement_type ON public.ad_banners(placement_type);
CREATE INDEX idx_news_ad_partners_news_id ON public.news_ad_partners(news_id);
CREATE INDEX idx_news_ad_partners_partner_id ON public.news_ad_partners(partner_id);