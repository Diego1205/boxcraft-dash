-- Create secure onboarding function for business creation
CREATE OR REPLACE FUNCTION public.onboard_business(
  _name text,
  _currency currency_type,
  _currency_symbol text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _business_id uuid;
  _user_id uuid;
BEGIN
  -- Get authenticated user ID
  _user_id := auth.uid();
  
  -- Check user is authenticated
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check user doesn't already have a business
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND business_id IS NOT NULL) THEN
    RAISE EXCEPTION 'User already has a business';
  END IF;
  
  -- Create the business
  INSERT INTO public.businesses (name, currency, currency_symbol)
  VALUES (_name, _currency, _currency_symbol)
  RETURNING id INTO _business_id;
  
  -- Update user profile with business_id
  UPDATE public.profiles
  SET business_id = _business_id
  WHERE id = _user_id;
  
  -- Create owner role
  INSERT INTO public.user_roles (user_id, role, business_id)
  VALUES (_user_id, 'owner', _business_id);
  
  -- Create default budget settings
  INSERT INTO public.budget_settings (business_id, total_budget, amount_spent)
  VALUES (_business_id, 0, 0);
  
  RETURN _business_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.onboard_business TO authenticated;