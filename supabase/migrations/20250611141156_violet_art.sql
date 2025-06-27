/*
  # Create saved_prompts table

  1. New Tables
    - `saved_prompts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text, for user-friendly naming)
      - `original_prompt` (text)
      - `optimized_prompt` (text, optional)
      - `prompt_type` (varchar, optional)
      - `model_used` (varchar, optional)
      - `tags` (text array, for categorization)
      - `is_favorite` (boolean, for marking favorites)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `saved_prompts` table
    - Add policies for authenticated users to manage their own saved prompts
*/

-- Create saved_prompts table
CREATE TABLE IF NOT EXISTS saved_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT,
  prompt_type VARCHAR(50),
  model_used VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_prompts table
CREATE POLICY "Users can view own saved prompts"
  ON saved_prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved prompts"
  ON saved_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved prompts"
  ON saved_prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved prompts"
  ON saved_prompts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS saved_prompts_user_id_idx ON saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS saved_prompts_created_at_idx ON saved_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS saved_prompts_is_favorite_idx ON saved_prompts(is_favorite);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_prompts_updated_at
    BEFORE UPDATE ON saved_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();