-- Update the trigger function to handle purchase completion
CREATE OR REPLACE FUNCTION handle_purchase_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a purchase request is marked as bought
  IF NEW.type = 'purchase' AND NEW.bought = true AND OLD.bought = false THEN
    -- Add the purchased items to equipment
    INSERT INTO equipment (
      name,
      description,
      quantity,
      category_id,
      status
    ) VALUES (
      NEW.name,
      NEW.description,
      NEW.quantity,
      NEW.category_id,
      'new'
    );

    -- Record the final price in price history
    INSERT INTO price_history (
      request_id,
      price,
      seller
    ) VALUES (
      NEW.id,
      NEW.best_price,
      COALESCE(NEW.seller, 'Unknown')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for purchase completion
DROP TRIGGER IF EXISTS on_purchase_completed ON requests;
CREATE TRIGGER on_purchase_completed
  AFTER UPDATE ON requests
  FOR EACH ROW
  WHEN (OLD.bought IS DISTINCT FROM NEW.bought)
  EXECUTE FUNCTION handle_purchase_completion();