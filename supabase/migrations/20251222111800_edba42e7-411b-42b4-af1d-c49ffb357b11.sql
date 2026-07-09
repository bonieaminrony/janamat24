-- Create storage bucket for news images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-images', 
  'news-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view images (public bucket)
CREATE POLICY "Public can view news images"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload news images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'news-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their images
CREATE POLICY "Authenticated users can update news images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'news-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete news images"
ON storage.objects FOR DELETE
USING (bucket_id = 'news-images' AND auth.role() = 'authenticated');