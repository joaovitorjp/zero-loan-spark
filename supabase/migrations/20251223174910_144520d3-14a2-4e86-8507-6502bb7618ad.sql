-- Allow authenticated users to insert themselves as admin if no admins exist yet (bootstrap)
CREATE OR REPLACE FUNCTION public.is_first_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
$$;

-- Policy for first admin bootstrap
CREATE POLICY "First user can become admin"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'admin' 
  AND public.is_first_admin()
);