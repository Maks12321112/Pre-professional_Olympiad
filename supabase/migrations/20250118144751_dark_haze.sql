-- Add 'purchase' to request_type enum
ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'purchase';

-- Add estimated_price column to requests table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'estimated_price'
  ) THEN
    ALTER TABLE requests ADD COLUMN estimated_price DECIMAL(10,2);
  END IF;
END $$;