-- Add bought column to requests table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'bought'
  ) THEN
    ALTER TABLE requests ADD COLUMN bought BOOLEAN DEFAULT false;
  END IF;
END $$;