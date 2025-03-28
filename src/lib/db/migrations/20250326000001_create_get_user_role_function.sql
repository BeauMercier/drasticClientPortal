-- Create a function to get user role

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'unknown');
END;
$$ LANGUAGE plpgsql; 