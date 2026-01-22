-- Add reorder_level column with default value of 10
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS reorder_level numeric DEFAULT 10;

-- Add category column for organizing items
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS category text;