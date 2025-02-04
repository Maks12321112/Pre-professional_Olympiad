/*
  # Add price history tracking

  1. New Tables
    - price_history
      - id (uuid, primary key)
      - request_id (uuid, references requests)
      - price (decimal)
      - seller (text)
      - recorded_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for viewing and inserting price history
*/

-- Create price history table if it doesn't exist
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  seller TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_price_history_request_id ON price_history(request_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at);

-- Enable RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view price history" ON price_history;
DROP POLICY IF EXISTS "Admins can insert price history" ON price_history;

-- Create policies
CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert price history"
  ON price_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add trigger to record price history when a purchase request is approved
CREATE OR REPLACE FUNCTION record_price_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'purchase' AND NEW.status = 'approved' AND NEW.best_price IS NOT NULL THEN
    INSERT INTO price_history (request_id, price, seller)
    VALUES (NEW.id, NEW.best_price, COALESCE(NEW.seller, 'Unknown'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_request_approved ON requests;
CREATE TRIGGER on_request_approved
  AFTER UPDATE ON requests
  FOR EACH ROW
  WHEN (OLD.status != 'approved' AND NEW.status = 'approved')
  EXECUTE FUNCTION record_price_history();