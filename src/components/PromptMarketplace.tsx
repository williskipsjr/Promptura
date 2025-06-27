import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Star, Copy, Download, Filter, TrendingUp, Clock, User, Heart, 
  MessageCircle, Share2, Eye, ThumbsUp, ThumbsDown, Plus, X, Send,
  AlertCircle, Loader, RefreshCw, ChevronDown, ChevronUp, Bookmark,
  BookmarkCheck, Flag, MoreHorizontal, Zap, Award, Users, Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';
import { MarketplaceService } from '../services/marketplace';
import PromptSubmissionModal from './marketplace/PromptSubmissionModal';
import type { MarketplacePrompt, PromptComment, PromptLike, UserFollow } from '../lib/supabase';

interface MarketplaceState {
  prompts: MarketplacePrompt[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  totalCount: number;
}

interface FilterState {
  search: string;
  category: string;
  sortBy: 'trending' | 'downloads' | 'recent' | 'rating' | 'likes';
  minRating: number;
  tags: string[];
  timeRange: 'all' | 'week' | 'month' | 'year';
}

interface InteractionStates {
  likedPrompts: Set<string>;
  followedUsers: Set<string>;
  savedPrompts: Set<string>;
  copyStates: { [key: string]: boolean };
  downloadStates: { [key: string]: boolean };
}

interface MarketplaceStats {
  totalPrompts: number;
  totalDownloads: number;
  totalLikes: number;
  totalViews: number;
  topCategories: Array<{ name: string; count: number }>;
}

const ITEMS_PER_PAGE = 12;
const DEBOUNCE_DELAY = 300;

const categories = [
  'Marketing', 'Content Creation', 'Code Generation', 'Analysis', 
  'Creative Writing', 'Business', 'Education', 'Research', 'Social Media',
  'Email', 'Product', 'Strategy', 'Design', 'Data Science', 'Customer Service',
  'Sales', 'HR', 'Legal', 'Finance', 'Healthcare', 'E-commerce', 'Gaming',
  'Travel', 'Food & Beverage', 'Real Estate', 'Non-profit', 'Entertainment'
];

const popularTags = [
  'conversion', 'engagement', 'automation', 'personalization', 'analytics',
  'optimization', 'creative', 'professional', 'beginner-friendly', 'advanced',
  'templates', 'frameworks', 'best-practices', 'trending', 'viral'
];

const PromptMarketplace: React.FC = () => {
  const { currentUser } = useAuth();
  
  // State management
  const [state, setState] = useState<MarketplaceState>({
    prompts: [],
    loading: true,
    error: null,
    hasMore: true,
    page: 0,
    totalCount: 0
  });

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    sortBy: 'trending',
    minRating: 0,
    tags: [],
    timeRange: 'all'
  });

  const [interactions, setInteractions] = useState<InteractionStates>({
    likedPrompts: new Set(),
    followedUsers: new Set(),
    savedPrompts: new Set(),
    copyStates: {},
    downloadStates: {}
  });

  const [selectedPrompt, setSelectedPrompt] = useState<MarketplacePrompt | null>(null);
  const [comments, setComments] = useState<PromptComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [submissionMode, setSubmissionMode] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search) {
        fetchPrompts(true);
      }
    }, DEBOUNCE_DELAY);
    
    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Fetch marketplace statistics
  const fetchStats = useCallback(async () => {
    try {
      const result = await MarketplaceService.getStats();
      if (result) {
        setStats({
          totalPrompts: result.total_prompts,
          totalDownloads: result.total_downloads,
          totalLikes: result.total_likes,
          totalViews: result.total_views,
          topCategories: Object.entries(result.categories)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch prompts with advanced filtering and pagination
  const fetchPrompts = useCallback(async (reset = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const currentPage = reset ? 0 : state.page;
      
      const result = await MarketplaceService.fetchPrompts(
        {
          search: filters.search,
          category: filters.category,
          rating_min: filters.minRating,
          sort_by: filters.sortBy,
          tags: filters.tags
        },
        currentPage,
        ITEMS_PER_PAGE
      );

      if (result.error) {
        setState(prev => ({ ...prev, loading: false, error: result.error! }));
        return;
      }

      const newPrompts = result.data;
      
      setState(prev => ({
        ...prev,
        prompts: reset ? newPrompts : [...prev.prompts, ...newPrompts],
        loading: false,
        hasMore: result.hasMore,
        page: currentPage + 1,
        totalCount: reset ? newPrompts.length : prev.totalCount + newPrompts.length
      }));

    } catch (error) {
      console.error('Error fetching prompts:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load prompts. Please try again.'
      }));
    }
  }, [state.page, filters]);

  // Load user interactions
  const loadUserInteractions = useCallback(async () => {
    if (!currentUser) return;

    try {
      const [likedPrompts, followedUsers] = await Promise.all([
        MarketplaceService.getUserLikes(currentUser.id),
        MarketplaceService.getUserFollows(currentUser.id)
      ]);

      setInteractions(prev => ({
        ...prev,
        likedPrompts: new Set(likedPrompts),
        followedUsers: new Set(followedUsers)
      }));
    } catch (error) {
      console.error('Error loading user interactions:', error);
    }
  }, [currentUser]);

  // Load comments for selected prompt
  const loadComments = useCallback(async (promptId: string) => {
    setLoadingComments(true);
    try {
      const commentsData = await MarketplaceService.getComments(promptId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  // Handle prompt interactions
  const handleLikePrompt = useCallback(async (promptId: string) => {
    if (!currentUser) return;

    try {
      const result = await MarketplaceService.toggleLike(promptId, currentUser.id);
      
      if (result.success) {
        setInteractions(prev => {
          const newLikedPrompts = new Set(prev.likedPrompts);
          if (result.isLiked) {
            newLikedPrompts.add(promptId);
          } else {
            newLikedPrompts.delete(promptId);
          }
          return { ...prev, likedPrompts: newLikedPrompts };
        });

        // Update prompt likes count in local state
        setState(prev => ({
          ...prev,
          prompts: prev.prompts.map(p => 
            p.id === promptId 
              ? { ...p, likes: p.likes + (result.isLiked ? 1 : -1) }
              : p
          )
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [currentUser]);

  const handleFollowUser = useCallback(async (username: string) => {
    if (!currentUser) return;

    try {
      const result = await MarketplaceService.toggleFollow(currentUser.id, username);
      
      if (result.success) {
        setInteractions(prev => {
          const newFollowedUsers = new Set(prev.followedUsers);
          if (result.isFollowing) {
            newFollowedUsers.add(username);
          } else {
            newFollowedUsers.delete(username);
          }
          return { ...prev, followedUsers: newFollowedUsers };
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }, [currentUser]);

  const handleCopyPrompt = useCallback(async (promptText: string, promptId: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      
      setInteractions(prev => ({
        ...prev,
        copyStates: { ...prev.copyStates, [promptId]: true }
      }));
      
      setTimeout(() => {
        setInteractions(prev => ({
          ...prev,
          copyStates: { ...prev.copyStates, [promptId]: false }
        }));
      }, 2000);

      // Increment views
      await MarketplaceService.incrementViews(promptId);
      
      // Update local state
      setState(prev => ({
        ...prev,
        prompts: prev.prompts.map(p => 
          p.id === promptId 
            ? { ...p, views: p.views + 1 }
            : p
        )
      }));

    } catch (error) {
      console.error('Error copying prompt:', error);
    }
  }, []);

  const handleDownload = useCallback(async (prompt: MarketplacePrompt) => {
    try {
      setInteractions(prev => ({
        ...prev,
        downloadStates: { ...prev.downloadStates, [prompt.id]: true }
      }));

      // Increment download count
      await MarketplaceService.incrementDownloads(prompt.id);

      // Create enhanced download file
      const downloadContent = `# ${prompt.title}

## Description
${prompt.description}

## Metadata
- **Category**: ${prompt.category}
- **Author**: ${prompt.author}
- **Rating**: ${prompt.rating}/5 ⭐
- **Performance Score**: ${prompt.performance_score}/100
- **Downloads**: ${prompt.downloads + 1}
- **Likes**: ${prompt.likes}
- **Created**: ${new Date(prompt.created_at).toLocaleDateString()}

## Prompt
\`\`\`
${prompt.prompt_text}
\`\`\`

## Use Cases
${prompt.use_cases.map(uc => `- ${uc}`).join('\n')}

## Tags
${prompt.tags.map(tag => `#${tag}`).join(' ')}

---
Downloaded from Promptura Marketplace
${new Date().toISOString()}
Visit: https://promptura.com`;

      const blob = new Blob([downloadContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prompt.title.toLowerCase().replace(/\s+/g, '-')}.md`;
      a.click();
      URL.revokeObjectURL(url);

      // Update local state
      setState(prev => ({
        ...prev,
        prompts: prev.prompts.map(p => 
          p.id === prompt.id 
            ? { ...p, downloads: p.downloads + 1 }
            : p
        )
      }));

      setTimeout(() => {
        setInteractions(prev => ({
          ...prev,
          downloadStates: { ...prev.downloadStates, [prompt.id]: false }
        }));
      }, 2000);

    } catch (error) {
      console.error('Error downloading prompt:', error);
    }
  }, []);

  const handleShare = useCallback(async (prompt: MarketplacePrompt) => {
    const shareText = `🚀 Check out "${prompt.title}" by ${prompt.author} on Promptura!\n\n${prompt.description}\n\n⭐ ${prompt.rating}/5 | 📥 ${prompt.downloads} downloads\n\n#AI #Prompts #${prompt.category.replace(/\s+/g, '')}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: prompt.title,
          text: shareText,
          url: `${window.location.origin}/marketplace?prompt=${prompt.id}`
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!currentUser || !selectedPrompt || !newComment.trim()) return;

    try {
      const result = await MarketplaceService.addComment(
        selectedPrompt.id,
        currentUser.id,
        newComment.trim()
      );

      if (result.success) {
        setNewComment('');
        await loadComments(selectedPrompt.id);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [currentUser, selectedPrompt, newComment, loadComments]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleTagFilter = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  }, []);

  // Effects
  useEffect(() => {
    fetchPrompts(true);
  }, [filters.category, filters.sortBy, filters.minRating, filters.tags, filters.timeRange]);

  useEffect(() => {
    loadUserInteractions();
    fetchStats();
  }, [loadUserInteractions, fetchStats]);

  useEffect(() => {
    if (selectedPrompt) {
      loadComments(selectedPrompt.id);
    }
  }, [selectedPrompt, loadComments]);

  // Memoized filtered prompts for performance
  const filteredPrompts = useMemo(() => {
    return state.prompts.filter(prompt => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          prompt.title.toLowerCase().includes(searchLower) ||
          prompt.description.toLowerCase().includes(searchLower) ||
          prompt.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          prompt.author.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [state.prompts, filters.search]);

  // Render loading state
  if (state.loading && state.prompts.length === 0) {
    return (
      <div className="space-y-8 pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="heading text-3xl md:text-4xl mb-4 text-text-primary">
            Prompt <span className="gradient-text">Marketplace</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Discover, share, and download high-performing prompts created by the community.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header with Stats */}
      <div className="text-center">
        <h2 className="heading text-3xl md:text-4xl mb-4 text-text-primary">
          Prompt <span className="gradient-text">Marketplace</span>
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto mb-6">
          Discover, share, and download high-performing prompts created by the community. Join the social network for prompt engineers.
        </p>
        
        {/* Stats Bar */}
        {stats && (
          <div className="glass rounded-xl p-4 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-500">{stats.totalPrompts.toLocaleString()}</div>
                <div className="text-sm text-text-secondary">Prompts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-500">{stats.totalDownloads.toLocaleString()}</div>
                <div className="text-sm text-text-secondary">Downloads</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-500">{stats.totalLikes.toLocaleString()}</div>
                <div className="text-sm text-text-secondary">Likes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-violet-400">{stats.totalViews.toLocaleString()}</div>
                <div className="text-sm text-text-secondary">Views</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="glass rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search prompts, creators, or tags..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="input-field pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange({ category: e.target.value })}
              className="input-field w-auto min-w-[150px]"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
              className="input-field w-auto min-w-[120px]"
            >
              <option value="trending">🔥 Trending</option>
              <option value="rating">⭐ Top Rated</option>
              <option value="downloads">📥 Most Downloaded</option>
              <option value="likes">❤️ Most Liked</option>
              <option value="recent">🕒 Most Recent</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-3 rounded-lg transition-colors",
                showFilters 
                  ? "bg-primary-500/20 text-primary-400" 
                  : "bg-background-dark hover:bg-background-light text-neutral-300"
              )}
            >
              <Filter className="h-5 w-5" />
            </button>

            {currentUser && (
              <button
                onClick={() => setSubmissionMode(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Submit Prompt
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="mt-6 pt-6 border-t border-border-color"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="space-y-4">
                {/* Rating Filter */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-text-secondary min-w-[100px]">Min Rating:</span>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange({ minRating: Number(e.target.value) })}
                    className="input-field w-auto"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars ⭐⭐⭐</option>
                    <option value={4}>4+ Stars ⭐⭐⭐⭐</option>
                    <option value={4.5}>4.5+ Stars ⭐⭐⭐⭐⭐</option>
                  </select>
                </div>

                {/* Time Range Filter */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-text-secondary min-w-[100px]">Time Range:</span>
                  <select
                    value={filters.timeRange}
                    onChange={(e) => handleFilterChange({ timeRange: e.target.value as any })}
                    className="input-field w-auto"
                  >
                    <option value="all">All Time</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>

                {/* Popular Tags */}
                <div>
                  <span className="text-sm text-text-secondary mb-2 block">Popular Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagFilter(tag)}
                        className={cn(
                          "text-xs px-3 py-1 rounded-full transition-colors",
                          filters.tags.includes(tag)
                            ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                            : "bg-accent-500/20 text-accent-400 hover:bg-accent-500/30"
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Filters */}
                {(filters.tags.length > 0 || filters.category || filters.minRating > 0) && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-text-secondary">Active filters:</span>
                    {filters.category && (
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full flex items-center gap-1">
                        {filters.category}
                        <button onClick={() => handleFilterChange({ category: '' })}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {filters.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full flex items-center gap-1">
                        #{tag}
                        <button onClick={() => handleTagFilter(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setFilters({
                        search: filters.search,
                        category: '',
                        sortBy: 'trending',
                        minRating: 0,
                        tags: [],
                        timeRange: 'all'
                      })}
                      className="text-xs text-error-500 hover:text-error-400"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error State */}
      {state.error && (
        <div className="glass rounded-xl p-6 border border-error-500/30">
          <div className="flex items-center gap-3 text-error-500">
            <AlertCircle className="h-5 w-5" />
            <p>{state.error}</p>
            <button
              onClick={() => fetchPrompts(true)}
              className="ml-auto btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary-500" />
          <h3 className="text-xl font-display font-bold text-text-primary">
            {filters.sortBy === 'trending' ? '🔥 Trending Now' : 
             filters.sortBy === 'recent' ? '🕒 Latest Prompts' :
             filters.sortBy === 'rating' ? '⭐ Top Rated' :
             filters.sortBy === 'downloads' ? '📥 Most Downloaded' : '❤️ Most Liked'}
          </h3>
          <span className="text-sm text-text-secondary">• {filteredPrompts.length} prompts</span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === 'grid' ? "bg-primary-500/20 text-primary-400" : "text-neutral-400 hover:text-white"
            )}
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === 'list' ? "bg-primary-500/20 text-primary-400" : "text-neutral-400 hover:text-white"
            )}
          >
            <div className="w-4 h-4 flex flex-col gap-0.5">
              <div className="bg-current h-0.5 rounded-sm"></div>
              <div className="bg-current h-0.5 rounded-sm"></div>
              <div className="bg-current h-0.5 rounded-sm"></div>
              <div className="bg-current h-0.5 rounded-sm"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Prompts Grid/List */}
      {filteredPrompts.length > 0 ? (
        <>
          <div className={cn(
            "gap-6",
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "flex flex-col space-y-4"
          )}>
            {filteredPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.id}
                className={cn(
                  "glass rounded-xl p-6 hover:scale-105 transition-all duration-300 relative overflow-hidden cursor-pointer group",
                  viewMode === 'list' && "flex items-center gap-6 hover:scale-102"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedPrompt(prompt)}
              >
                {/* Performance Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {prompt.performance_score}%
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <>
                    {/* Author Section */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-lg">
                        {prompt.author_avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-text-primary">{prompt.author}</h4>
                          {currentUser && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollowUser(prompt.author);
                              }}
                              className={cn(
                                "text-xs px-2 py-1 rounded-full transition-colors",
                                interactions.followedUsers.has(prompt.author)
                                  ? "bg-primary-500 text-white"
                                  : "bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
                              )}
                            >
                              {interactions.followedUsers.has(prompt.author) ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">{new Date(prompt.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h3 className="font-display font-bold text-text-primary mb-2 line-clamp-2">{prompt.title}</h3>
                      <p className="text-sm text-text-secondary mb-3 line-clamp-3">{prompt.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-neutral-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span>{prompt.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>{prompt.downloads.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{prompt.likes.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{prompt.views.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {prompt.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {prompt.tags.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded-full">
                          +{prompt.tags.length - 3}
                        </span>
                      )}
                    </div>
                    
                    {/* Use Cases */}
                    <div className="mb-4">
                      <p className="text-xs text-neutral-400 mb-1">Perfect for:</p>
                      <ul className="text-xs text-text-secondary">
                        {prompt.use_cases.slice(0, 2).map((useCase, index) => (
                          <li key={index} className="line-clamp-1">• {useCase}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  /* List View Layout */
                  <div className="flex items-center gap-6 w-full">
                    <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center text-xl flex-shrink-0">
                      {prompt.author_avatar}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-display font-bold text-text-primary mb-1 line-clamp-1">{prompt.title}</h3>
                          <p className="text-sm text-text-secondary line-clamp-2">{prompt.description}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="text-xs text-yellow-500 flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            {prompt.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-neutral-400">
                          <span>by {prompt.author}</span>
                          <span>{prompt.downloads.toLocaleString()} downloads</span>
                          <span>{prompt.likes.toLocaleString()} likes</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {prompt.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentUser && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikePrompt(prompt.id);
                        }}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                          interactions.likedPrompts.has(prompt.id)
                            ? "bg-error-500/20 text-error-500"
                            : "bg-background-dark hover:bg-background-light text-neutral-300"
                        )}
                      >
                        <Heart className={cn("h-3 w-3", interactions.likedPrompts.has(prompt.id) && "fill-current")} />
                        {prompt.likes.toLocaleString()}
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(prompt);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-background-dark hover:bg-background-light text-neutral-300 transition-colors"
                    >
                      <Share2 className="h-3 w-3" />
                      Share
                    </button>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPrompt(prompt.prompt_text, prompt.id);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1 rounded-lg transition-colors text-xs",
                        interactions.copyStates[prompt.id]
                          ? "bg-success-500/20 text-success-500"
                          : "bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
                      )}
                    >
                      <Copy className="h-3 w-3" />
                      {interactions.copyStates[prompt.id] ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(prompt);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1 rounded-lg transition-colors text-xs",
                        interactions.downloadStates[prompt.id]
                          ? "bg-success-500/20 text-success-500"
                          : "bg-background-dark hover:bg-background-light text-neutral-300"
                      )}
                    >
                      <Download className="h-3 w-3" />
                      {interactions.downloadStates[prompt.id] ? 'Saved!' : 'Save'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Load More Button */}
          {state.hasMore && (
            <div className="text-center">
              <button
                onClick={() => fetchPrompts()}
                disabled={state.loading}
                className="btn btn-secondary flex items-center gap-2 mx-auto"
              >
                {state.loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Load More Prompts
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="glass rounded-xl p-12 text-center">
          <Search className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-display font-bold text-text-primary mb-2">
            No prompts found
          </h3>
          <p className="text-text-secondary mb-4">
            Try adjusting your search terms or filters to find more prompts.
          </p>
          {currentUser && (
            <button
              onClick={() => setSubmissionMode(true)}
              className="btn btn-primary"
            >
              Be the first to submit a prompt!
            </button>
          )}
        </div>
      )}

      {/* Prompt Detail Modal */}
      <AnimatePresence>
        {selectedPrompt && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPrompt(null)}
          >
            <motion.div
              className="glass rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-border-color">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-xl">
                      {selectedPrompt.author_avatar}
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-text-primary">{selectedPrompt.title}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-text-secondary">by {selectedPrompt.author}</span>
                        <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {selectedPrompt.performance_score}% Score
                        </span>
                        <span className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full">
                          {selectedPrompt.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPrompt(null)}
                    className="text-neutral-400 hover:text-white p-2"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Enhanced Stats */}
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{selectedPrompt.rating.toFixed(1)}</span>
                    <span className="text-xs text-text-secondary">/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-4 w-4 text-accent-500" />
                    <span className="text-sm">{selectedPrompt.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span className="text-sm">{selectedPrompt.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-violet-400" />
                    <span className="text-sm">{selectedPrompt.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{comments.length}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary-500" />
                        Description
                      </h3>
                      <p className="text-text-secondary leading-relaxed">{selectedPrompt.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <Award className="h-5 w-5 text-accent-500" />
                        Full Prompt
                      </h3>
                      <div className="glass p-4 rounded-lg relative group">
                        <pre className="text-text-primary whitespace-pre-wrap text-sm font-mono leading-relaxed">
                          {selectedPrompt.prompt_text}
                        </pre>
                        <button
                          onClick={() => handleCopyPrompt(selectedPrompt.prompt_text, selectedPrompt.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <Target className="h-5 w-5 text-pink-500" />
                        Use Cases
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedPrompt.use_cases.map((useCase, index) => (
                          <div key={index} className="flex items-center gap-2 text-text-secondary glass p-3 rounded-lg">
                            <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></span>
                            {useCase}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleCopyPrompt(selectedPrompt.prompt_text, selectedPrompt.id)}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Prompt
                      </button>
                      <button
                        onClick={() => handleDownload(selectedPrompt)}
                        className="btn btn-secondary flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                      <button
                        onClick={() => handleShare(selectedPrompt)}
                        className="btn btn-secondary flex items-center gap-2"
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </button>
                      {currentUser && (
                        <button
                          onClick={() => handleLikePrompt(selectedPrompt.id)}
                          className={cn(
                            "btn flex items-center gap-2",
                            interactions.likedPrompts.has(selectedPrompt.id)
                              ? "bg-error-500/20 text-error-500 border-error-500/30"
                              : "btn-secondary"
                          )}
                        >
                          <Heart className={cn("h-4 w-4", interactions.likedPrompts.has(selectedPrompt.id) && "fill-current")} />
                          {interactions.likedPrompts.has(selectedPrompt.id) ? 'Liked' : 'Like'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Sidebar */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5 text-violet-400" />
                        Author
                      </h3>
                      <div className="glass p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-lg">
                            {selectedPrompt.author_avatar}
                          </div>
                          <div>
                            <h4 className="font-medium text-text-primary">{selectedPrompt.author}</h4>
                            <p className="text-xs text-text-secondary">Prompt Engineer</p>
                          </div>
                        </div>
                        {currentUser && (
                          <button
                            onClick={() => handleFollowUser(selectedPrompt.author)}
                            className={cn(
                              "w-full btn text-sm",
                              interactions.followedUsers.has(selectedPrompt.author)
                                ? "bg-primary-500 text-white"
                                : "btn-secondary"
                            )}
                          >
                            {interactions.followedUsers.has(selectedPrompt.author) ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold mb-3">Details</h3>
                      <div className="space-y-3">
                        <div className="glass p-3 rounded-lg">
                          <span className="text-sm text-text-secondary">Category:</span>
                          <span className="ml-2 text-sm px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full">
                            {selectedPrompt.category}
                          </span>
                        </div>
                        <div className="glass p-3 rounded-lg">
                          <span className="text-sm text-text-secondary">Created:</span>
                          <span className="ml-2 text-sm">{new Date(selectedPrompt.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="glass p-3 rounded-lg">
                          <span className="text-sm text-text-secondary">Performance:</span>
                          <span className="ml-2 text-sm font-medium text-primary-400">{selectedPrompt.performance_score}/100</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPrompt.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSelectedPrompt(null);
                              handleTagFilter(tag);
                            }}
                            className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full hover:bg-accent-500/30 transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Comments Section */}
                    <div>
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Comments ({comments.length})
                      </h3>

                      {/* Add Comment */}
                      {currentUser ? (
                        <div className="mb-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="input-field flex-1"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                            />
                            <button
                              onClick={handleAddComment}
                              disabled={!newComment.trim()}
                              className="btn btn-primary p-3"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 glass p-3 rounded-lg text-center">
                          <p className="text-sm text-text-secondary">
                            <Link to="/login" className="text-primary-400 hover:text-primary-300">Sign in</Link> to join the conversation
                          </p>
                        </div>
                      )}

                      {/* Comments List */}
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {loadingComments ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader className="w-5 h-5 animate-spin" />
                          </div>
                        ) : comments.length > 0 ? (
                          comments.map((comment) => (
                            <div key={comment.id} className="glass p-3 rounded-lg">
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-xs">
                                  {comment.author_avatar}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium">{comment.author_name}</span>
                                    <span className="text-xs text-text-secondary">
                                      {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-text-secondary">{comment.comment_text}</p>
                                  {comment.replies && comment.replies.length > 0 && (
                                    <div className="mt-2 ml-4 space-y-2">
                                      {comment.replies.map((reply) => (
                                        <div key={reply.id} className="glass p-2 rounded-lg">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium">{reply.author_name}</span>
                                            <span className="text-xs text-text-secondary">
                                              {new Date(reply.created_at).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <p className="text-xs text-text-secondary">{reply.comment_text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-text-secondary text-center py-4">
                            No comments yet. Be the first to comment!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Submission Modal */}
      <PromptSubmissionModal
        isOpen={submissionMode}
        onClose={() => setSubmissionMode(false)}
        onSuccess={() => {
          fetchPrompts(true);
          fetchStats();
        }}
      />
    </div>
  );
};

export default PromptMarketplace;