-- Prevent all updates to view records (view records should be immutable)
CREATE POLICY "Prevent updates to view records"
ON public.news_views FOR UPDATE
USING (false);

-- Allow only admins to delete view records (for data cleanup)
CREATE POLICY "Admin can delete view records"
ON public.news_views FOR DELETE
USING (is_admin_or_editor(auth.uid()));