-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for admin access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles (only admins can view roles)
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create loan_applications table with client_token for secure anonymous access
CREATE TABLE public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_token UUID NOT NULL DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_amount DECIMAL(12,2),
  address TEXT,
  age INTEGER,
  birth_date DATE,
  mother_name TEXT,
  gender TEXT,
  cpf_status TEXT,
  cns_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on loan_applications
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

-- Enable realtime for loan_applications
ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_applications;

-- Set REPLICA IDENTITY FULL for complete row data in realtime updates
ALTER TABLE public.loan_applications REPLICA IDENTITY FULL;

-- RLS Policies for loan_applications:

-- 1. Anyone can INSERT a new application (public access for applicants)
CREATE POLICY "Anyone can submit loan application"
ON public.loan_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Applicants can SELECT their own application using client_token
-- This is handled via Edge Function for security (no direct SELECT for anon)

-- 3. Admins can SELECT all applications
CREATE POLICY "Admins can view all applications"
ON public.loan_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admins can UPDATE applications
CREATE POLICY "Admins can update applications"
ON public.loan_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Admins can DELETE applications
CREATE POLICY "Admins can delete applications"
ON public.loan_applications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_loan_applications_updated_at
BEFORE UPDATE ON public.loan_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();