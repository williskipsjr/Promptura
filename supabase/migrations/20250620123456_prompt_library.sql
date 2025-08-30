/*
  # Prompt Library Migration

  1. New Tables
    - `prompt_library_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text)
      - `prompt_text` (text)
      - `before_image_url` (text, nullable)
      - `after_image_url` (text)
      - `tags` (text array)
      - `likes` (integer)
      - `views` (integer)
      - `saves` (integer)
      - `author` (text)
      - `author_avatar` (text)
      - `is_public` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `prompt_library_likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `entry_id` (uuid, references prompt_library_entries)
      - `liked` (boolean)
      - `created_at` (timestamp)

    - `prompt_library_saves`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `entry_id` (uuid, references prompt_library_entries)
      - `saved` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Public read access for prompt_library_entries
    - Authenticated users can manage their own likes and saves
    - Users can submit entries to the prompt library
*/

-- Create prompt_library_entries table
CREATE TABLE IF NOT EXISTS prompt_library_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  before_image_url TEXT,
  after_image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  author TEXT NOT NULL,
  author_avatar TEXT DEFAULT '👤',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_library_likes table
CREATE TABLE IF NOT EXISTS prompt_library_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID REFERENCES prompt_library_entries(id) ON DELETE CASCADE NOT NULL,
  liked BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_id)
);

-- Create prompt_library_saves table
CREATE TABLE IF NOT EXISTS prompt_library_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID REFERENCES prompt_library_entries(id) ON DELETE CASCADE NOT NULL,
  saved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_id)
);

-- Enable Row Level Security
ALTER TABLE prompt_library_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_library_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_library_saves ENABLE ROW LEVEL SECURITY;

-- Policies for prompt_library_entries table
-- Public read access for published entries
CREATE POLICY "Anyone can view public prompt library entries"
  ON prompt_library_entries
  FOR SELECT
  USING (is_public = true);

-- Users can view their own entries (including private ones)
CREATE POLICY "Users can view own prompt library entries"
  ON prompt_library_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own prompt library entries"
  ON prompt_library_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own prompt library entries"
  ON prompt_library_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own prompt library entries"
  ON prompt_library_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for prompt_library_likes table
-- Users can view all likes (for displaying like counts)
CREATE POLICY "Anyone can view prompt library likes"
  ON prompt_library_likes
  FOR SELECT
  USING (true);

-- Users can manage their own likes
CREATE POLICY "Users can insert own prompt library likes"
  ON prompt_library_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompt library likes"
  ON prompt_library_likes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt library likes"
  ON prompt_library_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for prompt_library_saves table
-- Users can view all saves (for displaying save counts)
CREATE POLICY "Anyone can view prompt library saves"
  ON prompt_library_saves
  FOR SELECT
  USING (true);

-- Users can manage their own saves
CREATE POLICY "Users can insert own prompt library saves"
  ON prompt_library_saves
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompt library saves"
  ON prompt_library_saves
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt library saves"
  ON prompt_library_saves
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS prompt_library_entries_user_id_idx ON prompt_library_entries(user_id);
CREATE INDEX IF NOT EXISTS prompt_library_entries_created_at_idx ON prompt_library_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS prompt_library_entries_is_public_idx ON prompt_library_entries(is_public);
CREATE INDEX IF NOT EXISTS prompt_library_entries_likes_idx ON prompt_library_entries(likes DESC);
CREATE INDEX IF NOT EXISTS prompt_library_entries_views_idx ON prompt_library_entries(views DESC);
CREATE INDEX IF NOT EXISTS prompt_library_entries_saves_idx ON prompt_library_entries(saves DESC);
CREATE INDEX IF NOT EXISTS prompt_library_entries_tags_idx ON prompt_library_entries USING GIN(tags);

CREATE INDEX IF NOT EXISTS prompt_library_likes_user_id_idx ON prompt_library_likes(user_id);
CREATE INDEX IF NOT EXISTS prompt_library_likes_entry_id_idx ON prompt_library_likes(entry_id);
CREATE INDEX IF NOT EXISTS prompt_library_likes_liked_idx ON prompt_library_likes(liked);

CREATE INDEX IF NOT EXISTS prompt_library_saves_user_id_idx ON prompt_library_saves(user_id);
CREATE INDEX IF NOT EXISTS prompt_library_saves_entry_id_idx ON prompt_library_saves(entry_id);
CREATE INDEX IF NOT EXISTS prompt_library_saves_saved_idx ON prompt_library_saves(saved);

-- Create triggers for updated_at columns
CREATE TRIGGER update_prompt_library_entries_updated_at
    BEFORE UPDATE ON prompt_library_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();