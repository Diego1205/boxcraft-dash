-- Trigger function to automatically mark order as Completed when delivery is confirmed
CREATE OR REPLACE FUNCTION public.complete_order_on_delivery_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when confirmed_at changes from NULL to a value
  IF NEW.confirmed_at IS NOT NULL AND (OLD.confirmed_at IS NULL) THEN
    UPDATE public.orders
    SET status = 'Completed'
    WHERE id = NEW.order_id
      AND status != 'Completed'
      AND status != 'Cancelled';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_delivery_confirmed
  AFTER UPDATE ON public.delivery_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION complete_order_on_delivery_confirmation();

-- Also fix the existing confirmed delivery that didn't update
UPDATE orders 
SET status = 'Completed' 
WHERE id IN (
  SELECT order_id FROM delivery_confirmations 
  WHERE confirmed_at IS NOT NULL
)
AND status != 'Completed'
AND status != 'Cancelled';