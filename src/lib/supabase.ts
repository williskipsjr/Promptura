import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enhanced types for our database tables
export interface Prompt {
  id: string;
  user_id: string;
  original_prompt: string;
  optimized_prompt?: string;
  prompt_type?: string;
  model_used?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedPrompt {
  id: string;
  user_id: string;
  title: string;
  original_prompt: string;
  optimized_prompt?: string;
  prompt_type?: string;
  model_used?: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptFeedback {
  id: string;
  user_id: string;
  prompt: string;
  feedback_type: 'like' | 'dislike';
  original_prompt?: string;
  prompt_type?: string;
  model_used?: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  default_model: string;
  default_temperature: number;
  default_style: string;
  default_tone: string;
  created_at: string;
  updated_at: string;
}

// Enhanced marketplace types with comprehensive fields
export interface MarketplacePrompt {
  id: string;
  user_id: string;
  title: string;
  description: string;
  prompt_text: string;
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
  likes: number;
  views: number;
  author: string;
  author_avatar: string;
  is_featured: boolean;
  is_public: boolean;
  use_cases: string[];
  performance_score: number;
  created_at: string;
  updated_at: string;
}

// Prompt Library types
export interface PromptLibraryEntry {
  id: string;
  user_id: string;
  title: string;
  description: string;
  prompt_text: string;
  before_image_url?: string;
  after_image_url: string;
  tags: string[];
  likes: number;
  views: number;
  saves: number;
  author: string;
  author_avatar: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptLibraryLike {
  id: string;
  user_id: string;
  entry_id: string;
  liked: boolean;
  created_at: string;
}

export interface PromptLibrarySave {
  id: string;
  user_id: string;
  entry_id: string;
  saved: boolean;
  created_at: string;
}

export interface PromptLike {
  id: string;
  user_id: string;
  prompt_id: string;
  liked: boolean;
  created_at: string;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_username: string;
  following: boolean;
  created_at: string;
}

export interface PromptComment {
  id: string;
  user_id: string;
  prompt_id: string;
  comment_text: string;
  parent_comment_id?: string;
  likes: number;
  created_at: string;
  updated_at: string;
  // Additional fields for display
  author_name?: string;
  author_avatar?: string;
  replies?: PromptComment[];
  user?: {
    user_metadata?: {
      full_name?: string;
    };
  };
}

// Prompt Versioning types
export interface PromptVersion {
  id: string;
  prompt_id: string;
  user_id: string;
  version_number: number;
  title: string;
  content: string;
  change_description?: string;
  parent_version_id?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptComparison {
  id: string;
  user_id: string;
  version_a_id: string;
  version_b_id: string;
  comparison_notes?: string;
  created_at: string;
  // Additional fields for UI
  version_a?: PromptVersion;
  version_b?: PromptVersion;
}

export interface VersionHistory {
  versions: PromptVersion[];
  total_versions: number;
  current_version: PromptVersion;
  recent_changes: PromptVersion[];
}

// Enhanced filter and stats types
export interface MarketplaceFilters {
  category?: string;
  tags?: string[];
  rating_min?: number;
  sort_by?: 'trending' | 'downloads' | 'recent' | 'rating' | 'likes';
  search?: string;
  time_range?: 'all' | 'week' | 'month' | 'year';
  author?: string;
  featured_only?: boolean;
}

export interface MarketplaceStats {
  total_prompts: number;
  total_downloads: number;
  total_likes: number;
  total_views: number;
  categories: { [key: string]: number };
  trending_tags?: string[];
  top_authors?: Array<{ name: string; prompts: number; likes: number }>;
  growth_metrics?: {
    prompts_this_week: number;
    downloads_this_week: number;
    new_users_this_week: number;
  };
}

// User profile and analytics types
export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar: string;
  bio?: string;
  website?: string;
  location?: string;
  joined_date: string;
  total_prompts: number;
  total_downloads: number;
  total_likes: number;
  followers_count: number;
  following_count: number;
  is_verified: boolean;
  badges: string[];
}

export interface UserAnalytics {
  user_id: string;
  total_prompts: number;
  total_downloads: number;
  total_likes: number;
  total_views: number;
  avg_rating: number;
  top_categories: Array<{ category: string; count: number }>;
  performance_trend: Array<{ date: string; downloads: number; likes: number }>;
  recent_activity: Array<{
    type: 'prompt_submitted' | 'prompt_liked' | 'user_followed';
    date: string;
    details: any;
  }>;
}

// Notification and activity types
export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'download' | 'feature';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: string;
  description: string;
  metadata?: any;
  created_at: string;
}

// Search and recommendation types
export interface SearchResult {
  prompts: MarketplacePrompt[];
  users: UserProfile[];
  total_results: number;
  search_time_ms: number;
  suggestions: string[];
}

export interface Recommendation {
  prompt: MarketplacePrompt;
  score: number;
  reason: string;
  similarity_factors: string[];
}

// Error handling types
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  success: boolean;
  metadata?: {
    total_count?: number;
    page?: number;
    limit?: number;
    has_more?: boolean;
  };
}

// Real-time subscription types
export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
}

// Export utility functions for common operations
export const supabaseUtils = {
  // Format user display name
  formatUserName: (user: any): string => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';
  },

  // Generate avatar based on name
  generateAvatar: (name: string): string => {
    const avatars = ['👤', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🧑‍🎨', '👨‍🔬', '👩‍🔬'];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatars.length;
    return avatars[index];
  },

  // Format relative time
  formatRelativeTime: (date: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  },

  // Validate prompt content
  validatePrompt: (prompt: Partial<MarketplacePrompt>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!prompt.title || prompt.title.length < 5) {
      errors.push('Title must be at least 5 characters');
    }
    if (!prompt.description || prompt.description.length < 20) {
      errors.push('Description must be at least 20 characters');
    }
    if (!prompt.prompt_text || prompt.prompt_text.length < 50) {
      errors.push('Prompt text must be at least 50 characters');
    }
    if (!prompt.category) {
      errors.push('Category is required');
    }
    if (!prompt.tags || prompt.tags.length === 0) {
      errors.push('At least one tag is required');
    }

    return { valid: errors.length === 0, errors };
  }
};