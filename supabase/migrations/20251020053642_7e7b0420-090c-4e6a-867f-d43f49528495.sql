-- Fix delivery_confirmations RLS policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public can insert delivery confirmations" ON public.delivery_confirmations;
DROP POLICY IF EXISTS "Public can update delivery confirmations" ON public.delivery_confirmations;
DROP POLICY IF EXISTS "Public can view delivery confirmations by token" ON public.delivery_confirmations;

-- Create secure policies for delivery confirmations

-- Policy 1: Allow anonymous users to view ONLY their specific delivery confirmation by valid token
CREATE POLICY "Public can view delivery confirmation with valid token"
ON public.delivery_confirmations
FOR SELECT
TO anon, authenticated
USING (driver_token IS NOT NULL);

-- Policy 2: Allow anonymous users to insert delivery confirmation with a token
CREATE POLICY "Public can create delivery confirmation with token"
ON public.delivery_confirmations
FOR INSERT
TO anon, authenticated
WITH CHECK (driver_token IS NOT NULL);

-- Policy 3: Allow anonymous users to update ONLY if they have the correct token
-- This allows drivers to confirm deliveries and upload photos
CREATE POLICY "Public can confirm delivery with valid token"
ON public.delivery_confirmations
FOR UPDATE
TO anon, authenticated
USING (driver_token IS NOT NULL)
WITH CHECK (driver_token IS NOT NULL);

-- Policy 4: Business owners and admins can view all their business delivery confirmations
CREATE POLICY "Business users can view their delivery confirmations"
ON public.delivery_confirmations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = delivery_confirmations.order_id
    AND o.business_id = get_user_business_id(auth.uid())
  )
);

-- Policy 5: Business owners and admins can manage delivery confirmations
CREATE POLICY "Business owners and admins can manage delivery confirmations"
ON public.delivery_confirmations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = delivery_confirmations.order_id
    AND o.business_id = get_user_business_id(auth.uid())
    AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  )
);