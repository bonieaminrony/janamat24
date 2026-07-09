-- Drop existing overly permissive policies for news-images bucket
DROP POLICY IF EXISTS "Authenticated users can upload news images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update news images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Create restrictive policies for admin/editor only (aligns with ad-images bucket)
CREATE POLICY "Admin/Editor can upload news images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'news-images' AND is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can update news images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'news-images' AND is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can delete news images"
ON storage.objects FOR DELETE
USING (bucket_id = 'news-images' AND is_admin_or_editor(auth.uid()));