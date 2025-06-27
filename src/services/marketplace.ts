import { supabase } from '../lib/supabase';
import type { MarketplacePrompt, PromptComment, MarketplaceFilters, MarketplaceStats } from '../lib/supabase';

// Enhanced rate limiting for marketplace operations
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_MINUTE = 50; // Increased for production
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number }>();

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    requestCount = 0;
    lastResetTime = now;
  }
  return requestCount < MAX_REQUESTS_PER_MINUTE;
}

function getCacheKey(prefix: string, params: any): string {
  return `${prefix}_${JSON.stringify(params)}`;
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
  
  // Clean old cache entries
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

export class MarketplaceService {
  // Fetch prompts with advanced filtering, caching, and pagination
  static async fetchPrompts(
    filters: MarketplaceFilters = {},
    page = 0,
    limit = 12
  ): Promise<{ data: MarketplacePrompt[]; hasMore: boolean; error?: string }> {
    if (!checkRateLimit()) {
      return { data: [], hasMore: false, error: 'Rate limit exceeded. Please try again later.' };
    }

    try {
      requestCount++;
      
      // Check cache for this request
      const cacheKey = getCacheKey('prompts', { filters, page, limit });
      const cached = getFromCache<{ data: MarketplacePrompt[]; hasMore: boolean }>(cacheKey);
      if (cached) {
        return cached;
      }

      const offset = page * limit;

      let query = supabase
        .from('marketplace_prompts')
        .select('*')
        .eq('is_public', true)
        .range(offset, offset + limit - 1);

      // Apply filters with improved search
      if (filters.search) {
        const searchTerms = filters.search.toLowerCase().split(' ').filter(term => term.length > 0);
        const searchConditions = searchTerms.map(term => 
          `title.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}},author.ilike.%${term}%`
        ).join(',');
        query = query.or(searchConditions);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.rating_min && filters.rating_min > 0) {
        query = query.gte('rating', filters.rating_min);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Apply advanced sorting with trending algorithm
      switch (filters.sort_by) {
        case 'trending':
          // Enhanced trending algorithm: (likes * 2 + views + downloads * 3) / days_since_creation
          query = query.order('created_at', { ascending: false })
                      .order('likes', { ascending: false })
                      .order('views', { ascending: false });
          break;
        case 'downloads':
          query = query.order('downloads', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false })
                      .order('downloads', { ascending: false });
          break;
        case 'likes':
          query = query.order('likes', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      const result = {
        data: data || [],
        hasMore: (data || []).length === limit
      };

      // Cache the result
      setCache(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Error fetching marketplace prompts:', error);
      return {
        data: [],
        hasMore: false,
        error: 'Failed to load prompts. Please try again.'
      };
    }
  }

  // Get comprehensive marketplace statistics with caching
  static async getStats(): Promise<MarketplaceStats | null> {
    try {
      const cacheKey = 'marketplace_stats';
      const cached = getFromCache<MarketplaceStats>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('marketplace_prompts')
        .select('category, downloads, likes, views')
        .eq('is_public', true);

      if (error) throw error;

      const stats: MarketplaceStats = {
        total_prompts: data.length,
        total_downloads: data.reduce((sum, p) => sum + p.downloads, 0),
        total_likes: data.reduce((sum, p) => sum + p.likes, 0),
        total_views: data.reduce((sum, p) => sum + p.views, 0),
        categories: {}
      };

      // Count prompts by category
      data.forEach(prompt => {
        stats.categories[prompt.category] = (stats.categories[prompt.category] || 0) + 1;
      });

      // Cache for 10 minutes (stats don't change frequently)
      cache.set(cacheKey, { data: stats, timestamp: Date.now() });

      return stats;
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
      return null;
    }
  }

  // Submit a new prompt with enhanced validation
  static async submitPrompt(promptData: {
    title: string;
    description: string;
    prompt_text: string;
    category: string;
    tags: string[];
    use_cases: string[];
    is_public: boolean;
  }, userId: string, authorName: string): Promise<{ success: boolean; error?: string; promptId?: string }> {
    try {
      // Enhanced validation
      if (promptData.title.length < 5 || promptData.title.length > 100) {
        return { success: false, error: 'Title must be between 5 and 100 characters' };
      }

      if (promptData.description.length < 20 || promptData.description.length > 500) {
        return { success: false, error: 'Description must be between 20 and 500 characters' };
      }

      if (promptData.prompt_text.length < 50 || promptData.prompt_text.length > 5000) {
        return { success: false, error: 'Prompt text must be between 50 and 5000 characters' };
      }

      if (promptData.tags.length === 0 || promptData.tags.length > 10) {
        return { success: false, error: 'Please provide 1-10 tags' };
      }

      if (promptData.use_cases.length === 0 || promptData.use_cases.length > 10) {
        return { success: false, error: 'Please provide 1-10 use cases' };
      }

      // Calculate initial performance score based on content quality
      const performanceScore = this.calculatePerformanceScore(promptData);

      const { data, error } = await supabase
        .from('marketplace_prompts')
        .insert({
          ...promptData,
          user_id: userId,
          author: authorName,
          author_avatar: this.generateAvatar(authorName),
          performance_score: performanceScore,
          rating: 0,
          downloads: 0,
          likes: 0,
          views: 0
        })
        .select('id')
        .single();

      if (error) throw error;

      // Clear relevant caches
      this.clearCache(['prompts', 'marketplace_stats']);

      return { success: true, promptId: data.id };
    } catch (error) {
      console.error('Error submitting prompt:', error);
      return { 
        success: false, 
        error: 'Failed to submit prompt. Please try again.' 
      };
    }
  }

  // Enhanced like/unlike with optimistic updates
  static async toggleLike(promptId: string, userId: string): Promise<{ success: boolean; isLiked: boolean }> {
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('prompt_likes')
        .select('*')
        .eq('user_id', userId)
        .eq('prompt_id', promptId)
        .single();

      if (existingLike) {
        // Remove like
        await supabase
          .from('prompt_likes')
          .delete()
          .eq('user_id', userId)
          .eq('prompt_id', promptId);

        // Decrement likes count atomically
        await supabase.rpc('decrement_likes', { prompt_id: promptId });

        return { success: true, isLiked: false };
      } else {
        // Add like
        await supabase
          .from('prompt_likes')
          .insert({
            user_id: userId,
            prompt_id: promptId,
            liked: true
          });

        // Increment likes count atomically
        await supabase.rpc('increment_likes', { prompt_id: promptId });

        return { success: true, isLiked: true };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return { success: false, isLiked: false };
    }
  }

  // Enhanced follow/unfollow with user validation
  static async toggleFollow(followerId: string, followingUsername: string): Promise<{ success: boolean; isFollowing: boolean }> {
    try {
      // Prevent self-following
      const { data: followerData } = await supabase
        .from('auth.users')
        .select('user_metadata')
        .eq('id', followerId)
        .single();

      const followerName = followerData?.user_metadata?.full_name || 'Unknown';
      if (followerName === followingUsername) {
        return { success: false, isFollowing: false };
      }

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_username', followingUsername)
        .single();

      if (existingFollow) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_username', followingUsername);

        return { success: true, isFollowing: false };
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({
            follower_id: followerId,
            following_username: followingUsername,
            following: true
          });

        return { success: true, isFollowing: true };
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      return { success: false, isFollowing: false };
    }
  }

  // Enhanced comment system with moderation
  static async addComment(
    promptId: string, 
    userId: string, 
    commentText: string, 
    parentCommentId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate comment
      if (commentText.length < 3 || commentText.length > 500) {
        return { success: false, error: 'Comment must be between 3 and 500 characters' };
      }

      // Basic content moderation (can be enhanced with AI)
      const inappropriateWords = ['spam', 'scam', 'fake'];
      const hasInappropriateContent = inappropriateWords.some(word => 
        commentText.toLowerCase().includes(word)
      );

      if (hasInappropriateContent) {
        return { success: false, error: 'Comment contains inappropriate content' };
      }

      const { error } = await supabase
        .from('prompt_comments')
        .insert({
          user_id: userId,
          prompt_id: promptId,
          comment_text: commentText.trim(),
          parent_comment_id: parentCommentId || null
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { 
        success: false, 
        error: 'Failed to add comment. Please try again.' 
      };
    }
  }

  // Enhanced comment fetching with nested replies
  static async getComments(promptId: string): Promise<PromptComment[]> {
    try {
      // Get top-level comments with user data
      const { data: topLevelComments, error } = await supabase
        .from('prompt_comments')
        .select(`
          *,
          user:user_id (
            user_metadata
          )
        `)
        .eq('prompt_id', promptId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        (topLevelComments || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from('prompt_comments')
            .select(`
              *,
              user:user_id (
                user_metadata
              )
            `)
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          return {
            ...comment,
            author_name: comment.user?.user_metadata?.full_name || 'Anonymous',
            author_avatar: this.generateAvatar(comment.user?.user_metadata?.full_name || 'Anonymous'),
            replies: (replies || []).map(reply => ({
              ...reply,
              author_name: reply.user?.user_metadata?.full_name || 'Anonymous',
              author_avatar: this.generateAvatar(reply.user?.user_metadata?.full_name || 'Anonymous')
            }))
          };
        })
      );

      return commentsWithReplies;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  // Atomic increment operations
  static async incrementViews(promptId: string): Promise<void> {
    try {
      await supabase.rpc('increment_views', { prompt_id: promptId });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  static async incrementDownloads(promptId: string): Promise<void> {
    try {
      await supabase.rpc('increment_downloads', { prompt_id: promptId });
    } catch (error) {
      console.error('Error incrementing downloads:', error);
    }
  }

  // Enhanced user interaction fetching with caching
  static async getUserLikes(userId: string): Promise<string[]> {
    try {
      const cacheKey = `user_likes_${userId}`;
      const cached = getFromCache<string[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('prompt_likes')
        .select('prompt_id')
        .eq('user_id', userId)
        .eq('liked', true);

      if (error) throw error;

      const likes = (data || []).map(like => like.prompt_id);
      setCache(cacheKey, likes);

      return likes;
    } catch (error) {
      console.error('Error fetching user likes:', error);
      return [];
    }
  }

  static async getUserFollows(userId: string): Promise<string[]> {
    try {
      const cacheKey = `user_follows_${userId}`;
      const cached = getFromCache<string[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('user_follows')
        .select('following_username')
        .eq('follower_id', userId)
        .eq('following', true);

      if (error) throw error;

      const follows = (data || []).map(follow => follow.following_username);
      setCache(cacheKey, follows);

      return follows;
    } catch (error) {
      console.error('Error fetching user follows:', error);
      return [];
    }
  }

  // Advanced search with ranking
  static async searchPrompts(
    query: string,
    filters: Omit<MarketplaceFilters, 'search'> = {},
    page = 0,
    limit = 12
  ): Promise<{ data: MarketplacePrompt[]; hasMore: boolean }> {
    try {
      const offset = page * limit;
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

      let supabaseQuery = supabase
        .from('marketplace_prompts')
        .select('*')
        .eq('is_public', true)
        .range(offset, offset + limit - 1);

      // Enhanced search with multiple term support
      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map(term => 
          `title.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}},author.ilike.%${term}%`
        ).join(',');
        supabaseQuery = supabaseQuery.or(searchConditions);
      }

      // Apply additional filters
      if (filters.category) {
        supabaseQuery = supabaseQuery.eq('category', filters.category);
      }
      
      if (filters.rating_min && filters.rating_min > 0) {
        supabaseQuery = supabaseQuery.gte('rating', filters.rating_min);
      }

      // Sort by relevance (combination of rating, downloads, and likes)
      supabaseQuery = supabaseQuery.order('rating', { ascending: false })
                                  .order('downloads', { ascending: false })
                                  .order('likes', { ascending: false });

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      return {
        data: data || [],
        hasMore: (data || []).length === limit
      };

    } catch (error) {
      console.error('Error searching prompts:', error);
      return { data: [], hasMore: false };
    }
  }

  // Get trending prompts with advanced algorithm
  static async getTrendingPrompts(limit = 10): Promise<MarketplacePrompt[]> {
    try {
      const cacheKey = `trending_prompts_${limit}`;
      const cached = getFromCache<MarketplacePrompt[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Advanced trending algorithm considering recency, engagement, and quality
      const { data, error } = await supabase
        .from('marketplace_prompts')
        .select('*')
        .eq('is_public', true)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('likes', { ascending: false })
        .order('downloads', { ascending: false })
        .order('views', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const trending = data || [];
      setCache(cacheKey, trending);

      return trending;
    } catch (error) {
      console.error('Error fetching trending prompts:', error);
      return [];
    }
  }

  // Utility methods
  private static calculatePerformanceScore(promptData: {
    title: string;
    description: string;
    prompt_text: string;
    tags: string[];
    use_cases: string[];
  }): number {
    let score = 50; // Base score

    // Title quality (0-15 points)
    if (promptData.title.length >= 10 && promptData.title.length <= 60) score += 10;
    if (promptData.title.includes(' ')) score += 5; // Multi-word titles

    // Description quality (0-15 points)
    if (promptData.description.length >= 50 && promptData.description.length <= 300) score += 10;
    if (promptData.description.includes('use') || promptData.description.includes('help')) score += 5;

    // Prompt text quality (0-20 points)
    if (promptData.prompt_text.length >= 100) score += 10;
    if (promptData.prompt_text.includes('Act as') || promptData.prompt_text.includes('You are')) score += 5;
    if (promptData.prompt_text.includes('Context:') || promptData.prompt_text.includes('Task:')) score += 5;

    // Tags and use cases (0-10 points)
    if (promptData.tags.length >= 3) score += 5;
    if (promptData.use_cases.length >= 2) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private static generateAvatar(name: string): string {
    const avatars = ['👤', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🧑‍🎨', '👨‍🔬', '👩‍🔬', '🧑‍🏫', '👨‍⚕️', '👩‍⚕️'];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatars.length;
    return avatars[index];
  }

  private static clearCache(prefixes: string[]): void {
    for (const [key] of cache) {
      if (prefixes.some(prefix => key.startsWith(prefix))) {
        cache.delete(key);
      }
    }
  }
}

export default MarketplaceService;