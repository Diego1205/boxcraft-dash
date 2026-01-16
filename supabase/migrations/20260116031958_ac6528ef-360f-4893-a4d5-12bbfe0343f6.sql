-- 1. Add driver assignment column to orders
ALTER TABLE public.orders 
ADD COLUMN assigned_driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Create inventory restoration function for cancelled orders
CREATE OR REPLACE FUNCTION public.restore_inventory_on_order_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  component RECORD;
BEGIN
  -- Only trigger when status changes FROM 'Completed' TO 'Cancelled'
  IF OLD.status = 'Completed' AND NEW.status = 'Cancelled' THEN
    -- Restore inventory for each product component
    FOR component IN
      SELECT pc.inventory_item_id, pc.quantity as component_qty
      FROM product_components pc
      WHERE pc.product_id = NEW.product_id
    LOOP
      UPDATE inventory_items
      SET quantity = quantity + (component.component_qty * NEW.quantity)
      WHERE id = component.inventory_item_id;
    END LOOP;
    
    -- Restore product quantity
    UPDATE products
    SET quantity_available = quantity_available + NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create trigger for order cancellation
DROP TRIGGER IF EXISTS on_order_cancelled ON public.orders;
CREATE TRIGGER on_order_cancelled
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_inventory_on_order_cancel();