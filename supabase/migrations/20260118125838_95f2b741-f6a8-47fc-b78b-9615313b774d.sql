-- Create role audit log table
CREATE TABLE public.role_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  old_role TEXT,
  new_role TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_name TEXT,
  changed_by_name TEXT
);

-- Enable RLS
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.role_audit_log
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.role_audit_log
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_role_audit_log_user_id ON public.role_audit_log(user_id);
CREATE INDEX idx_role_audit_log_changed_at ON public.role_audit_log(changed_at DESC);