-- Add 'purchase' to request_type enum if it doesn't exist
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