/*
  # Add description column to equipment table

  1. Changes
    - Add `description` column to `equipment` table
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'equipment' AND column_name = 'description'
  ) THEN
    ALTER TABLE equipment ADD COLUMN description TEXT;
  END IF;
END $$;