/*
  # Complete Database Migration for Promptura

  This migration creates all necessary tables and policies for the Promptura application.

  ## Tables Created:
  1. `prompts` - Stores generated prompts and their optimizations
  2. `saved_prompts` - Stores user's saved/bookmarked prompts
  3. `prompt_feedback` - Stores user feedback on generated prompts

  ## Security:
  - All tables have Row Level Security (RLS) enabled
  - Users can only access their own data
  - Comprehensive policies for CRUD operations
*/

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  prompt_type VARCHAR(50),
  model_used VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create prompt_feedback table
CREATE TABLE IF NOT EXISTS prompt_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  original_prompt TEXT,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
  prompt_type VARCHAR(50),
  model_used VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for prompts table
CREATE POLICY "Users can view own prompts"
  ON prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON prompts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous users to insert prompts (for trial functionality)
CREATE POLICY "Anonymous users can insert prompts"
  ON prompts
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Policies for saved_prompts table
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

-- Policies for prompt_feedback table
CREATE POLICY "Users can view own feedback"
  ON prompt_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON prompt_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON prompt_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
  ON prompt_feedback
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous users to insert feedback (for trial functionality)
CREATE POLICY "Anonymous users can insert feedback"
  ON prompt_feedback
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS prompts_user_id_idx ON prompts(user_id);
CREATE INDEX IF NOT EXISTS prompts_created_at_idx ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS prompts_model_used_idx ON prompts(model_used);

CREATE INDEX IF NOT EXISTS saved_prompts_user_id_idx ON saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS saved_prompts_created_at_idx ON saved_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS saved_prompts_is_favorite_idx ON saved_prompts(is_favorite);
CREATE INDEX IF NOT EXISTS saved_prompts_tags_idx ON saved_prompts USING GIN(tags);

CREATE INDEX IF NOT EXISTS prompt_feedback_user_id_idx ON prompt_feedback(user_id);
CREATE INDEX IF NOT EXISTS prompt_feedback_created_at_idx ON prompt_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS prompt_feedback_type_idx ON prompt_feedback(feedback_type);

-- Create triggers for updated_at columns
CREATE TRIGGER update_prompts_updated_at
    BEFORE UPDATE ON prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_prompts_updated_at
    BEFORE UPDATE ON saved_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;