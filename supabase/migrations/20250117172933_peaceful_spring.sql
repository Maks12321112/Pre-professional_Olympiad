/*
  # Add owner field to equipment

  1. Changes
    - Add owner field to equipment table
    - Add owner_id field to equipment table for future user linking
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'equipment' AND column_name = 'owner'
  ) THEN
    ALTER TABLE equipment ADD COLUMN owner TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'equipment' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE equipment ADD COLUMN owner_id UUID REFERENCES auth.users(id);
  END IF;
END $$;