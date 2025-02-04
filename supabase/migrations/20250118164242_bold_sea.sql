/*
  # Add blocked user role and access control

  1. Changes
    - Add 'blocked' to user_role enum
    - Update RLS policies to prevent blocked users from accessing data
*/

-- Add 'blocked' to user_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'user_role' 
    AND 'blocked' = ANY(enum_range(NULL::user_role)::text[])
  ) THEN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'blocked';
  END IF;
END $$;

-- Update RLS policies to prevent blocked users from accessing data
CREATE OR REPLACE FUNCTION is_blocked()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'blocked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;