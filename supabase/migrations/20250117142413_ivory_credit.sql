/*
  # Fix database dependencies and policies

  This migration fixes the dependency issues between tables and policies by:
  1. Dropping dependent policies first
  2. Recreating policies with proper checks
  3. Adding better error handling
*/

-- Drop existing policies that depend on profiles table
DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;
DROP POLICY IF EXISTS "Admins can manage all requests" ON equipment_requests;
DROP POLICY IF EXISTS "Admins can manage all repair requests" ON repair_requests;
DROP POLICY IF EXISTS "Admins can manage purchase plans" ON purchase_plans;

-- Recreate policies with better error handling
CREATE POLICY "Admins can manage equipment"
  ON equipment FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can manage all requests"
  ON equipment_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can manage all repair requests"
  ON repair_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can manage purchase plans"
  ON purchase_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Add indexes to improve policy performance
CREATE INDEX IF NOT EXISTS profiles_role_id_idx ON profiles(role, id);