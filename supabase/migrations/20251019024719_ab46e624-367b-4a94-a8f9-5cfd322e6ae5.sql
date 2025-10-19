-- Create storage bucket for inventory item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-images', 'inventory-images', true);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 20,
  sale_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_components junction table
CREATE TABLE public.product_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order status enum
CREATE TYPE public.order_status AS ENUM (
  'New Inquiry',
  'In Progress', 
  'Deposit Received',
  'Ready for Delivery',
  'Completed',
  'Cancelled'
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_contact TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  sale_price DECIMAL(10,2) NOT NULL,
  delivery_info TEXT,
  payment_method TEXT,
  status public.order_status DEFAULT 'New Inquiry',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget settings table
CREATE TABLE public.budget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_budget DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default budget record
INSERT INTO public.budget_settings (total_budget, amount_spent) VALUES (0, 0);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now - can add auth later)
CREATE POLICY "Allow all on inventory_items" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on product_components" ON public.product_components FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on budget_settings" ON public.budget_settings FOR ALL USING (true) WITH CHECK (true);

-- Storage policies for inventory images
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING (bucket_id = 'inventory-images');
CREATE POLICY "Allow public insert access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inventory-images');
CREATE POLICY "Allow public update access" ON storage.objects FOR UPDATE USING (bucket_id = 'inventory-images');
CREATE POLICY "Allow public delete access" ON storage.objects FOR DELETE USING (bucket_id = 'inventory-images');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_settings_updated_at BEFORE UPDATE ON public.budget_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();