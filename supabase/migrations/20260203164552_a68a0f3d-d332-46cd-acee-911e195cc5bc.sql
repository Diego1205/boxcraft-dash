-- Add phone_number column to profiles table for contact information
ALTER TABLE public.profiles
ADD COLUMN phone_number text;

COMMENT ON COLUMN public.profiles.phone_number IS 'Optional contact phone number';