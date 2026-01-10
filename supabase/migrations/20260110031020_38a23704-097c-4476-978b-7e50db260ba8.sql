-- Fix user_roles RLS: Allow all users to view roles in their business
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Business owners can manage roles" ON public.user_roles;

-- Users can view all roles in their business
CREATE POLICY "Users can view roles in their business"
ON public.user_roles
FOR SELECT
USING (business_id = get_user_business_id(auth.uid()));

-- Only owners can insert/update/delete roles
CREATE POLICY "Business owners can manage roles"
ON public.user_roles
FOR ALL
USING (
  business_id = get_user_business_id(auth.uid()) 
  AND has_role(auth.uid(), 'owner'::app_role)
);

-- Fix profiles RLS: Allow users to view profiles of team members in their business
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Users can view their own profile OR profiles of users in the same business
CREATE POLICY "Users can view profiles in their business"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() 
  OR business_id = get_user_business_id(auth.uid())
);