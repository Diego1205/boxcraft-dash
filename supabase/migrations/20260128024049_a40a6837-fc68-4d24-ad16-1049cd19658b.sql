-- Function to safely assign a user to a business (called by owner during invite)
CREATE OR REPLACE FUNCTION public.assign_user_to_business(
  _user_id uuid,
  _business_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the caller is an owner
  IF NOT has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Only business owners can assign users to businesses';
  END IF;

  -- Verify caller belongs to the target business
  IF get_user_business_id(auth.uid()) != _business_id THEN
    RAISE EXCEPTION 'Cannot assign users to a different business';
  END IF;

  -- Update the user's profile with the business_id
  UPDATE public.profiles
  SET business_id = _business_id
  WHERE id = _user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
END;
$$;

-- Fix existing orphaned profiles (users with roles but NULL business_id)
UPDATE profiles p
SET business_id = ur.business_id
FROM user_roles ur
WHERE p.id = ur.user_id
  AND p.business_id IS NULL
  AND ur.business_id IS NOT NULL;