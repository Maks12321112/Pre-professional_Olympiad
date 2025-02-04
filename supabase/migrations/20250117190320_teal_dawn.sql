/*
  # Update request_type enum

  1. Changes
    - Add 'repair' to request_type enum values
    - Safely handle existing data

  2. Security
    - No changes to RLS policies needed
*/

-- Update the request_type enum to include 'repair'
ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'repair';