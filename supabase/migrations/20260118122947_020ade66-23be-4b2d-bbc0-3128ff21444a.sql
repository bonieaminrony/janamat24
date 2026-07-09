-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users with admin/editor role to upload avatars
CREATE POLICY "Admins and editors can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-avatars' AND
  public.check_user_has_admin_role(auth.uid())
);

-- Allow authenticated users with admin/editor role to update avatars
CREATE POLICY "Admins and editors can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-avatars' AND
  public.check_user_has_admin_role(auth.uid())
);

-- Allow authenticated users with admin/editor role to delete avatars
CREATE POLICY "Admins and editors can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-avatars' AND
  public.check_user_has_admin_role(auth.uid())
);

-- Allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-avatars');