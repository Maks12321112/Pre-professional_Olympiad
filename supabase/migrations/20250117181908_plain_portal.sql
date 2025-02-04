-- Add category_id column to requests table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE requests ADD COLUMN category_id UUID REFERENCES equipment_categories(id);
  END IF;
END $$;

-- Add index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_requests_category_id ON requests(category_id);