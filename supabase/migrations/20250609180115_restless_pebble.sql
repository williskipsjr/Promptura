/*
  # Add trigger to automatically create user preferences

  1. Function
    - `create_user_preferences()` - Creates default user preferences for new users
  
  2. Trigger
    - Executes after user creation in auth.users table
    - Automatically creates user_preferences record with default values
*/

-- Create function to automatically create user preferences
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (
    user_id,
    default_model,
    default_temperature,
    default_style,
    default_tone
  ) VALUES (
    NEW.id,
    'gpt-4',
    0.7,
    'balanced',
    'professional'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user preferences when a new user signs up
CREATE OR REPLACE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();