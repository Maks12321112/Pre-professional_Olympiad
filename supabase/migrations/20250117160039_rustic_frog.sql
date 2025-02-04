/*
  # Add equipment categories

  1. New Tables
    - `equipment_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add category_id to equipment table
    - Add foreign key constraint

  3. Security
    - Enable RLS on equipment_categories table
    - Add policies for viewing and managing categories
*/

-- Create equipment categories table
CREATE TABLE IF NOT EXISTS equipment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add category_id to equipment table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'equipment' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE equipment ADD COLUMN category_id UUID REFERENCES equipment_categories(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;

-- Policies for equipment categories
CREATE POLICY "Anyone can view equipment categories"
  ON equipment_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage equipment categories"
  ON equipment_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'::user_role
    )
  );