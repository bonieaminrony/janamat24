-- Allow admins/editors to view all profiles for reporter management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Allow admins to delete profiles for reporter management
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Allow admins to update any profile for reporter management
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));