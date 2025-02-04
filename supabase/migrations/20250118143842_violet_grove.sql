-- Create a secure view to access auth.users emails
CREATE OR REPLACE VIEW users AS 
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE 
  -- Only show emails to authenticated users
  auth.role() = 'authenticated' AND
  -- Admins can see all emails
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) OR
  -- Regular users can only see their own email
  au.id = auth.uid());

-- Grant access to the authenticated users
GRANT SELECT ON users TO authenticated;