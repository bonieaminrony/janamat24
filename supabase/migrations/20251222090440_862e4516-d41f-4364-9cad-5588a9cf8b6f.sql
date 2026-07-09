-- Create a secure RPC function for checking admin/editor role
-- This provides a server-side verification that's more reliable than client-side checks
CREATE OR REPLACE FUNCTION public.check_user_has_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'editor')
  )
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.check_user_has_admin_role(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.check_user_has_admin_role(uuid) FROM anon;