-- Enable realtime for loan_applications table
ALTER TABLE public.loan_applications REPLICA IDENTITY FULL;