
-- Create function to update user role when creator is approved
CREATE OR REPLACE FUNCTION update_user_role_on_creator_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If creator is being approved (approved changes from false/null to true)
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    -- Update the user's role to 'creator'
    UPDATE users 
    SET role = 'creator', updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for creator approval
DROP TRIGGER IF EXISTS creator_approval_trigger ON creators;
CREATE TRIGGER creator_approval_trigger
  AFTER UPDATE ON creators
  FOR EACH ROW 
  WHEN (NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false))
  EXECUTE FUNCTION update_user_role_on_creator_approval();

-- Update existing approved creators who still have 'client' role
UPDATE users 
SET role = 'creator', updated_at = now()
WHERE id IN (
  SELECT c.user_id 
  FROM creators c 
  JOIN users u ON c.user_id = u.id 
  WHERE c.approved = true AND u.role = 'client'
);
