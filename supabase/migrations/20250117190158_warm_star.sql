/*
  # Add equipment relationship to requests table

  1. Changes
    - Add equipment_id column to requests table
    - Add foreign key constraint to equipment table
    - Add index for better performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add equipment_id column to requests table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'equipment_id'
  ) THEN
    ALTER TABLE requests 
    ADD COLUMN equipment_id UUID REFERENCES equipment(id);
  END IF;
END $$;

-- Add index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON requests(equipment_id);