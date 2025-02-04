-- Add price tracking columns to requests table
DO $$ 
BEGIN
  -- Add best_price column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'best_price'
  ) THEN
    ALTER TABLE requests ADD COLUMN best_price DECIMAL(10,2);
  END IF;

  -- Add purchase_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'purchase_url'
  ) THEN
    ALTER TABLE requests ADD COLUMN purchase_url TEXT;
  END IF;

  -- Add seller column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'seller'
  ) THEN
    ALTER TABLE requests ADD COLUMN seller TEXT;
  END IF;
END $$;