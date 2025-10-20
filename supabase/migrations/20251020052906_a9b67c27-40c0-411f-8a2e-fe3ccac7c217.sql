-- Create enums for roles and currency
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'driver');
CREATE TYPE public.currency_type AS ENUM ('USD', 'CAD', 'PEN');

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  currency currency_type NOT NULL DEFAULT 'USD',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role, business_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create delivery_confirmations table
CREATE TABLE public.delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_token TEXT UNIQUE NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  delivery_photo_url TEXT,
  driver_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;

-- Add business_id to existing tables
ALTER TABLE public.inventory_items ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.product_components ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.budget_settings ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_inventory_items_business_id ON public.inventory_items(business_id);
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE INDEX idx_orders_business_id ON public.orders(business_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_business_id ON public.profiles(business_id);

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's business_id
CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- Create trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for businesses
CREATE POLICY "Users can view their own business"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business owners can update their business"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (id = public.get_user_business_id(auth.uid()) AND public.has_role(auth.uid(), 'owner'));

-- Update RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Update RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Business owners can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid()) 
    AND public.has_role(auth.uid(), 'owner')
  );

-- Update RLS policies for inventory_items
DROP POLICY IF EXISTS "Allow all on inventory_items" ON public.inventory_items;

CREATE POLICY "Users can view their business inventory"
  ON public.inventory_items FOR SELECT
  TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Owners and admins can manage inventory"
  ON public.inventory_items FOR ALL
  TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  );

-- Update RLS policies for products
DROP POLICY IF EXISTS "Allow all on products" ON public.products;

CREATE POLICY "Users can view their business products"
  ON public.products FOR SELECT
  TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Owners and admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  );

-- Update RLS policies for product_components
DROP POLICY IF EXISTS "Allow all on product_components" ON public.product_components;

CREATE POLICY "Users can view their business product components"
  ON public.product_components FOR SELECT
  TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Owners and admins can manage product components"
  ON public.product_components FOR ALL
  TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  );

-- Update RLS policies for orders
DROP POLICY IF EXISTS "Allow all on orders" ON public.orders;

CREATE POLICY "Users can view their business orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Owners and admins can manage orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  );

-- Update RLS policies for budget_settings
DROP POLICY IF EXISTS "Allow all on budget_settings" ON public.budget_settings;

CREATE POLICY "Users can view their business budget"
  ON public.budget_settings FOR SELECT
  TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Owners and admins can manage budget"
  ON public.budget_settings FOR ALL
  TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  );

-- RLS policies for delivery_confirmations
CREATE POLICY "Public can view delivery confirmations by token"
  ON public.delivery_confirmations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can insert delivery confirmations"
  ON public.delivery_confirmations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update delivery confirmations"
  ON public.delivery_confirmations FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Create storage bucket for delivery photos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('delivery-photos', 'delivery-photos', true, 5242880);

-- RLS policies for delivery-photos bucket
CREATE POLICY "Public can upload delivery photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'delivery-photos');

CREATE POLICY "Public can view delivery photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'delivery-photos');

CREATE POLICY "Business owners can delete delivery photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'delivery-photos');

-- Add updated_at triggers to new tables
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();