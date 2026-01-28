-- Function to clear a user's business_id when removing from team
CREATE OR REPLACE FUNCTION public.clear_user_business(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is an owner
  IF NOT has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Only business owners can remove users';
  END IF;

  -- Verify the target user was in caller's business
  IF get_user_business_id(_user_id) != get_user_business_id(auth.uid()) THEN
    RAISE EXCEPTION 'Cannot modify users from other businesses';
  END IF;

  -- Clear the business_id
  UPDATE public.profiles
  SET business_id = NULL
  WHERE id = _user_id;
END;
$$;