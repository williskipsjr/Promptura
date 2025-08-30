/*
  # Prompt Versioning System

  1. New Tables
    - `prompt_versions`
      - `id` (uuid, primary key)
      - `prompt_id` (uuid, references saved_prompts)
      - `user_id` (uuid, references auth.users)
      - `version_number` (integer)
      - `title` (text)
      - `content` (text)
      - `change_description` (text, optional)
      - `parent_version_id` (uuid, references prompt_versions, optional)
      - `is_current` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `prompt_comparisons`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `version_a_id` (uuid, references prompt_versions)
      - `version_b_id` (uuid, references prompt_versions)
      - `comparison_notes` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create prompt_versions table
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID REFERENCES saved_prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  change_description TEXT,
  parent_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, version_number)
);

-- Create prompt_comparisons table
CREATE TABLE IF NOT EXISTS prompt_comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  version_a_id UUID REFERENCES prompt_versions(id) ON DELETE CASCADE NOT NULL,
  version_b_id UUID REFERENCES prompt_versions(id) ON DELETE CASCADE NOT NULL,
  comparison_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_comparisons ENABLE ROW LEVEL SECURITY;

-- Create policies for prompt_versions table
CREATE POLICY "Users can view own prompt versions"
  ON prompt_versions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompt versions"
  ON prompt_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompt versions"
  ON prompt_versions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt versions"
  ON prompt_versions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for prompt_comparisons table
CREATE POLICY "Users can view own prompt comparisons"
  ON prompt_comparisons
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompt comparisons"
  ON prompt_comparisons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompt comparisons"
  ON prompt_comparisons
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt comparisons"
  ON prompt_comparisons
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS prompt_versions_prompt_id_idx ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS prompt_versions_user_id_idx ON prompt_versions(user_id);
CREATE INDEX IF NOT EXISTS prompt_versions_created_at_idx ON prompt_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS prompt_versions_is_current_idx ON prompt_versions(is_current);
CREATE INDEX IF NOT EXISTS prompt_comparisons_user_id_idx ON prompt_comparisons(user_id);
CREATE INDEX IF NOT EXISTS prompt_comparisons_created_at_idx ON prompt_comparisons(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_prompt_versions_updated_at
    BEFORE UPDATE ON prompt_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create initial version when a saved prompt is created
CREATE OR REPLACE FUNCTION create_initial_prompt_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO prompt_versions (
    prompt_id,
    user_id,
    version_number,
    title,
    content,
    change_description,
    is_current
  ) VALUES (
    NEW.id,
    NEW.user_id,
    1,
    NEW.title,
    COALESCE(NEW.optimized_prompt, NEW.original_prompt),
    'Initial version',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create initial version
CREATE TRIGGER create_initial_prompt_version_trigger
  AFTER INSERT ON saved_prompts
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_prompt_version();

-- Function to ensure only one current version per prompt
CREATE OR REPLACE FUNCTION ensure_single_current_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    -- Set all other versions of this prompt to not current
    UPDATE prompt_versions 
    SET is_current = false 
    WHERE prompt_id = NEW.prompt_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one current version
CREATE TRIGGER ensure_single_current_version_trigger
  BEFORE INSERT OR UPDATE ON prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_current_version();