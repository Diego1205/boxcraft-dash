
-- 1. Platform Admins Table
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read own entry"
  ON public.platform_admins FOR SELECT
  USING (user_id = auth.uid());

-- 2. Security Definer Function
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id
  )
$$;

-- 3. Subscription columns on businesses
ALTER TABLE public.businesses ADD COLUMN subscription_tier text NOT NULL DEFAULT 'free_trial';
ALTER TABLE public.businesses ADD COLUMN subscription_status text NOT NULL DEFAULT 'active';
ALTER TABLE public.businesses ADD COLUMN trial_ends_at timestamptz DEFAULT (now() + interval '14 days');

-- 4. RLS policies for platform admins to read all data
CREATE POLICY "Platform admins can view all businesses"
  ON public.businesses FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update businesses"
  ON public.businesses FOR UPDATE
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view all user_roles"
  ON public.user_roles FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view all products"
  ON public.products FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view all inventory"
  ON public.inventory_items FOR SELECT
  USING (public.is_platform_admin(auth.uid()));
