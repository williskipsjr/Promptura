/*
  # Add prompt feedback table

  1. New Tables
    - `prompt_feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `prompt` (text)
      - `feedback_type` (varchar)
      - `original_prompt` (text)
      - `prompt_type` (varchar)
      - `model_used` (varchar)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on prompt_feedback table
    - Add policies for authenticated users to manage their own data
*/

-- Create prompt_feedback table
CREATE TABLE IF NOT EXISTS prompt_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
  original_prompt TEXT,
  prompt_type VARCHAR(50),
  model_used VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prompt_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for prompt_feedback table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS prompt_feedback_user_id_idx ON prompt_feedback(user_id);
CREATE INDEX IF NOT EXISTS prompt_feedback_created_at_idx ON prompt_feedback(created_at DESC);