-- Remove the problematic trigger and allow public loan applications
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Update RLS policies to allow anonymous loan applications
DROP POLICY IF EXISTS "Users can create their own applications" ON public.loan_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.loan_applications;

-- Create new policies for public access to loan applications
CREATE POLICY "Anyone can create loan applications" 
ON public.loan_applications 
FOR INSERT 
WITH CHECK (true);

-- Keep admin access
DROP POLICY IF EXISTS "Admins can view all applications" ON public.loan_applications;
CREATE POLICY "Admins can view all applications" 
ON public.loan_applications 
FOR ALL
USING (true);

-- Allow public to view their applications by email (for status checking)
CREATE POLICY "Users can view applications by email" 
ON public.loan_applications 
FOR SELECT 
USING (true);