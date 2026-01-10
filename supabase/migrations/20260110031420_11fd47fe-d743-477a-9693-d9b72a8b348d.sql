-- Create function to deduct inventory when order is completed
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_order_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  component RECORD;
BEGIN
  -- Only trigger when status changes TO 'Completed' from something else
  IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
    -- Get the product components for this order's product
    FOR component IN
      SELECT pc.inventory_item_id, pc.quantity as component_qty
      FROM product_components pc
      WHERE pc.product_id = NEW.product_id
    LOOP
      -- Deduct inventory: component_qty * order quantity
      UPDATE inventory_items
      SET quantity = quantity - (component.component_qty * NEW.quantity)
      WHERE id = component.inventory_item_id;
    END LOOP;
    
    -- Also decrease the product's quantity_available
    UPDATE products
    SET quantity_available = quantity_available - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS on_order_completed ON public.orders;
CREATE TRIGGER on_order_completed
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_inventory_on_order_complete();