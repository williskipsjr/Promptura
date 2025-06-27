/*
  # Marketplace Features Migration

  1. New Tables
    - `marketplace_prompts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text)
      - `prompt_text` (text)
      - `category` (varchar)
      - `tags` (text array)
      - `rating` (decimal)
      - `downloads` (integer)
      - `likes` (integer)
      - `views` (integer)
      - `author` (text)
      - `author_avatar` (text)
      - `is_featured` (boolean)
      - `is_public` (boolean)
      - `use_cases` (text array)
      - `performance_score` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `prompt_likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `prompt_id` (uuid, references marketplace_prompts)
      - `liked` (boolean)
      - `created_at` (timestamp)

    - `user_follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, references auth.users)
      - `following_username` (text)
      - `following` (boolean)
      - `created_at` (timestamp)

    - `prompt_comments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `prompt_id` (uuid, references marketplace_prompts)
      - `comment_text` (text)
      - `parent_comment_id` (uuid, references prompt_comments, nullable)
      - `likes` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Public read access for marketplace_prompts and prompt_comments
    - Authenticated users can manage their own likes, follows, and comments
    - Users can submit prompts to marketplace
*/

-- Create marketplace_prompts table
CREATE TABLE IF NOT EXISTS marketplace_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 0.0,
  downloads INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  author TEXT NOT NULL,
  author_avatar TEXT DEFAULT '👤',
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  use_cases TEXT[] DEFAULT '{}',
  performance_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_likes table
CREATE TABLE IF NOT EXISTS prompt_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES marketplace_prompts(id) ON DELETE CASCADE NOT NULL,
  liked BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_username TEXT NOT NULL,
  following BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_username)
);

-- Create prompt_comments table
CREATE TABLE IF NOT EXISTS prompt_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES marketplace_prompts(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES prompt_comments(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE marketplace_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_comments ENABLE ROW LEVEL SECURITY;

-- Policies for marketplace_prompts table
-- Public read access for published prompts
CREATE POLICY "Anyone can view public marketplace prompts"
  ON marketplace_prompts
  FOR SELECT
  USING (is_public = true);

-- Users can view their own prompts (including private ones)
CREATE POLICY "Users can view own marketplace prompts"
  ON marketplace_prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own prompts
CREATE POLICY "Users can insert own marketplace prompts"
  ON marketplace_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own prompts
CREATE POLICY "Users can update own marketplace prompts"
  ON marketplace_prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own prompts
CREATE POLICY "Users can delete own marketplace prompts"
  ON marketplace_prompts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for prompt_likes table
-- Users can view all likes (for displaying like counts)
CREATE POLICY "Anyone can view prompt likes"
  ON prompt_likes
  FOR SELECT
  USING (true);

-- Users can manage their own likes
CREATE POLICY "Users can insert own likes"
  ON prompt_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own likes"
  ON prompt_likes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON prompt_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_follows table
-- Users can view all follows (for displaying follower counts)
CREATE POLICY "Anyone can view user follows"
  ON user_follows
  FOR SELECT
  USING (true);

-- Users can manage their own follows
CREATE POLICY "Users can insert own follows"
  ON user_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update own follows"
  ON user_follows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON user_follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Policies for prompt_comments table
-- Anyone can view comments
CREATE POLICY "Anyone can view prompt comments"
  ON prompt_comments
  FOR SELECT
  USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments"
  ON prompt_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON prompt_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON prompt_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS marketplace_prompts_user_id_idx ON marketplace_prompts(user_id);
CREATE INDEX IF NOT EXISTS marketplace_prompts_created_at_idx ON marketplace_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_prompts_category_idx ON marketplace_prompts(category);
CREATE INDEX IF NOT EXISTS marketplace_prompts_is_public_idx ON marketplace_prompts(is_public);
CREATE INDEX IF NOT EXISTS marketplace_prompts_is_featured_idx ON marketplace_prompts(is_featured);
CREATE INDEX IF NOT EXISTS marketplace_prompts_rating_idx ON marketplace_prompts(rating DESC);
CREATE INDEX IF NOT EXISTS marketplace_prompts_downloads_idx ON marketplace_prompts(downloads DESC);
CREATE INDEX IF NOT EXISTS marketplace_prompts_likes_idx ON marketplace_prompts(likes DESC);
CREATE INDEX IF NOT EXISTS marketplace_prompts_tags_idx ON marketplace_prompts USING GIN(tags);

CREATE INDEX IF NOT EXISTS prompt_likes_user_id_idx ON prompt_likes(user_id);
CREATE INDEX IF NOT EXISTS prompt_likes_prompt_id_idx ON prompt_likes(prompt_id);
CREATE INDEX IF NOT EXISTS prompt_likes_liked_idx ON prompt_likes(liked);

CREATE INDEX IF NOT EXISTS user_follows_follower_id_idx ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS user_follows_following_username_idx ON user_follows(following_username);
CREATE INDEX IF NOT EXISTS user_follows_following_idx ON user_follows(following);

CREATE INDEX IF NOT EXISTS prompt_comments_user_id_idx ON prompt_comments(user_id);
CREATE INDEX IF NOT EXISTS prompt_comments_prompt_id_idx ON prompt_comments(prompt_id);
CREATE INDEX IF NOT EXISTS prompt_comments_parent_comment_id_idx ON prompt_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS prompt_comments_created_at_idx ON prompt_comments(created_at DESC);

-- Create triggers for updated_at columns
CREATE TRIGGER update_marketplace_prompts_updated_at
    BEFORE UPDATE ON marketplace_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_comments_updated_at
    BEFORE UPDATE ON prompt_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample marketplace prompts
INSERT INTO marketplace_prompts (
  user_id, title, description, prompt_text, category, tags, rating, downloads, likes, views,
  author, author_avatar, is_featured, is_public, use_cases, performance_score
) VALUES
(
  (SELECT id FROM auth.users LIMIT 1),
  'Ultimate Marketing Email Generator',
  'Creates compelling marketing emails with high conversion rates. Used by 500+ marketers.',
  'Act as a senior email marketing specialist with 10+ years of experience in creating high-converting email campaigns. Your task is to create compelling marketing emails that drive engagement and conversions.

Context: You understand consumer psychology, persuasion techniques, and email marketing best practices. You know how to craft subject lines that get opened, body content that engages, and calls-to-action that convert.

Constraints: Keep emails concise but impactful, use persuasive language without being pushy, include clear value propositions, and always include a strong call-to-action.

Output format: Provide the complete email including subject line, preview text, body content, and call-to-action button text.',
  'Marketing',
  ARRAY['email', 'marketing', 'conversion', 'sales'],
  4.9,
  1247,
  892,
  3421,
  'MarketingPro',
  '👨‍💼',
  true,
  true,
  ARRAY['Product launches', 'Newsletter campaigns', 'Sales outreach'],
  94
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'AI Code Review Assistant',
  'Provides detailed code reviews with improvement suggestions. Loved by developers.',
  'Act as a senior software engineer with expertise in code quality, security, and best practices. Your task is to conduct thorough code reviews that help developers improve their code quality and learn best practices.

Context: You have experience across multiple programming languages and frameworks. You understand clean code principles, design patterns, security vulnerabilities, and performance optimization techniques.

Constraints: Be constructive and educational in your feedback, prioritize critical issues first, provide specific examples and suggestions for improvement, and explain the reasoning behind your recommendations.

Output format: Structured review with sections for: Critical Issues, Improvements, Best Practices, Security Concerns, and Overall Assessment with a rating.',
  'Code Generation',
  ARRAY['code', 'review', 'programming', 'quality'],
  4.8,
  892,
  654,
  2156,
  'DevExpert',
  '👩‍💻',
  true,
  true,
  ARRAY['Code quality', 'Best practices', 'Security review'],
  91
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Viral Social Media Content Creator',
  'Generates engaging social media posts that drive massive engagement.',
  'Act as a viral content strategist and social media expert who understands what makes content shareable and engaging across different platforms. Your task is to create social media posts that capture attention and drive engagement.

Context: You understand platform-specific best practices, trending topics, hashtag strategies, and audience psychology. You know how to create content that resonates with different demographics and encourages sharing.

Constraints: Tailor content to the specific platform, use appropriate tone and style, include relevant hashtags, keep within character limits, and ensure content is authentic and valuable.

Output format: Platform-optimized post with caption, hashtags, and engagement strategy suggestions.',
  'Social Media',
  ARRAY['social', 'viral', 'engagement', 'content'],
  4.7,
  654,
  432,
  1876,
  'ContentKing',
  '🎨',
  true,
  true,
  ARRAY['Instagram posts', 'Twitter threads', 'LinkedIn content'],
  88
);