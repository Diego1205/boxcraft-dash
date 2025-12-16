-- Clean up orphaned records with null business_id
-- These are legacy records that shouldn't exist in a multi-tenant system

-- Delete product_components first (has FK to products and inventory_items)
DELETE FROM product_components WHERE business_id IS NULL;

-- Delete orders (has FK to products)
DELETE FROM orders WHERE business_id IS NULL;

-- Delete products
DELETE FROM products WHERE business_id IS NULL;

-- Delete inventory_items
DELETE FROM inventory_items WHERE business_id IS NULL;

-- Delete budget_settings
DELETE FROM budget_settings WHERE business_id IS NULL;