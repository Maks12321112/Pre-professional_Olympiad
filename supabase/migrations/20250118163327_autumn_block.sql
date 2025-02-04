/*
  # Add purchase request support

  1. Changes
    - Add purchase request type to request_type enum if not exists
    - Add columns for purchase requests:
      - best_price (decimal)
      - purchase_url (text)
      - seller (text)
*/

-- Add purchase to request_type enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'request_type' 
    AND 'purchase' = ANY(enum_range(NULL::request_type)::text[])
  ) THEN
    ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'purchase';
  END IF;
END $$;

-- Add columns for purchase requests
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