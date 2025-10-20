-- Add INSERT policy for businesses table
-- Allow authenticated users to create new businesses
CREATE POLICY "Users can create businesses"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (true);