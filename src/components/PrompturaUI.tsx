import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Star, Copy, Download, Filter, TrendingUp, Clock, User, Heart, 
  MessageCircle, Share2, Eye, ThumbsUp, ThumbsDown, Plus, X, Send,
  AlertCircle, Loader, RefreshCw, ChevronDown, ChevronUp, ChevronRight, Bookmark,
  BookmarkCheck, Flag, MoreHorizontal, Zap, Award, Users, Globe, Sparkles, Tag,
  Image, Video, MessageSquare, Wand2, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';
import PromptGenerator from './PromptGenerator';
import { ADVANCED_TECHNIQUES } from '../services/llm';
import type { PromptEntry } from '../lib/supabase';

const PrompturaUI: React.FC = () => {
  // Auth context
  const { user, profile } = useAuth();
  
  // State for prompt generator
  const [activeMode, setActiveMode] = useState<'text' | 'image' | 'video'>('text');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAlgorithmDropdown, setShowAlgorithmDropdown] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  
  // State for prompt gallery
  const [entries, setEntries] = useState<PromptEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<PromptEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryView, setGalleryView] = useState<'featured' | 'newest' | 'popular'>('featured');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  
  // Scroll observer for infinite loading
  const observerTarget = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  // Popular tags
  const popularTags = [
    'text-generation',
    'image-generation',
    'video-generation',
    'creative-writing',
    'code-generation',
    'story-telling',
    'marketing',
    'seo',
    'content-creation',
    'technical-writing'
  ];
  
  // External providers
  const textProviders = [
    { name: 'OpenAI', icon: <MessageSquare className="h-4 w-4" />, url: 'https://chat.openai.com' },
    { name: 'Gemini', icon: <Sparkles className="h-4 w-4" />, url: 'https://gemini.google.com' },
    { name: 'Anthropic', icon: <MessageCircle className="h-4 w-4" />, url: 'https://claude.ai' },
    { name: 'Perplexity', icon: <Search className="h-4 w-4" />, url: 'https://perplexity.ai' }
  ];
  
  const imageProviders = [
    { name: 'DALL-E', icon: <Image className="h-4 w-4" />, url: 'https://openai.com/dall-e-3' },
    { name: 'Midjourney', icon: <Sparkles className="h-4 w-4" />, url: 'https://midjourney.com' },
    { name: 'Stable Diffusion', icon: <Image className="h-4 w-4" />, url: 'https://stability.ai' }
  ];
  
  const videoProviders = [
    { name: 'Runway', icon: <Video className="h-4 w-4" />, url: 'https://runwayml.com' },
    { name: 'Pika', icon: <Video className="h-4 w-4" />, url: 'https://pika.art' },
    { name: 'Gen-2', icon: <Video className="h-4 w-4" />, url: 'https://research.runwayml.com/gen2' }
  ];
  
  // Fetch entries for the gallery
  const fetchEntries = useCallback(async (resetPage = false) => {
    try {
      setIsLoading(resetPage);
      setIsLoadingMore(!resetPage);
      const currentPage = resetPage ? 0 : page;
      
      if (resetPage) {
        setPage(0);
      }

      // Sort criteria based on gallery view
      const sortBy = 
        galleryView === 'newest' ? 'created_at' : 
        galleryView === 'popular' ? 'views' : 'likes';

      // Fetch from Supabase directly since we removed the service
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order(sortBy, { ascending: false })
        .range(currentPage * 20, (currentPage + 1) * 20 - 1);
      
      if (error) {
        setError(error.message);
        return;
      }

      setEntries(prev => resetPage ? data : [...prev, ...data]);
      setHasMore(data.length === 20);
      setError(null);
    } catch (error) {
      console.error('Error fetching prompt entries:', error);
      setError('Failed to load entries. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [galleryView, page]);

  // Load user likes
  const loadUserLikes = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('prompt_likes')
        .select('prompt_id')
        .eq('user_id', user.id);

      const likes: Record<string, boolean> = {};
      if (data) {
        data.forEach(like => {
          likes[like.prompt_id] = true;
        });
      }
      setUserLikes(likes);
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  }, [user]);

  // Handle like
  const handleLike = async (entryId: string) => {
    if (!user) return;

    try {
      const isLiked = userLikes[entryId];
      
      if (isLiked) {
        await supabase
          .from('prompt_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('prompt_id', entryId);
      } else {
        await supabase
          .from('prompt_likes')
          .insert({
            user_id: user.id,
            prompt_id: entryId
          });
      }

      // Update local state
      setUserLikes(prev => ({
        ...prev,
        [entryId]: !isLiked
      }));

      // Update entry like count
      setEntries(prev =>
        prev.map(entry =>
          entry.id === entryId
            ? { ...entry, likes_count: (entry.likes_count || 0) + (isLiked ? -1 : 1) }
            : entry
        )
      );
    } catch (error) {
      console.error('Error saving/unsaving entry:', error);
    }
  };

  // Handle copy prompt
  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (error) {
      console.error('Error copying prompt:', error);
    }
  };

  // Handle opening external provider
  const handleOpenProvider = (url: string, prompt: string) => {
    // Open the provider in a new tab
    window.open(url, '_blank');
    
    // In a real implementation, you would use the provider's API
    // to automatically paste and execute the prompt
  };

  // Handle algorithm selection
  const handleAlgorithmSelect = (technique: string) => {
    setShowAlgorithmDropdown(false);
    setSelectedTechnique(technique);
    
    if (prompt) {
      setIsGenerating(true);
      // Import the generatePrompt function from llm.ts
      import('../services/llm').then(({ generatePrompt }) => {
        // Call the generatePrompt function with the selected technique
        generatePrompt(prompt, {
          technique: technique,
          mode: activeMode,
        })
        .then(optimizedPrompt => {
          setGeneratedPrompt(optimizedPrompt);
          setIsGenerating(false);
        })
        .catch(error => {
          console.error('Error optimizing prompt:', error);
          setIsGenerating(false);
        });
      });
    }
  };

  // Handle prompt generation
  const handlePromptGenerated = (generatedPrompt: string) => {
    setGeneratedPrompt(generatedPrompt);
  };
  
  // Handle prompt input change
  const handlePromptChange = (inputPrompt: string) => {
    setPrompt(inputPrompt);
  };

  // Handle card click to show modal
  const handleCardClick = (entry: PromptEntry) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  // Initial data loading
  useEffect(() => {
    fetchEntries(true);
  }, [fetchEntries, galleryView]);

  useEffect(() => {
    if (user) {
      loadUserLikes();
    }
  }, [loadUserLikes, user, entries]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          setPage(prevPage => prevPage + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoadingMore, isLoading]);

  // Scroll to gallery section
  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Prompt Generator Section */}
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Promptura
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Generate optimized prompts for any AI model
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setActiveMode('text')}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-l-md",
                  activeMode === 'text'
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Text Mode
              </button>
              <button
                onClick={() => setActiveMode('image')}
                className={cn(
                  "px-4 py-2 text-sm font-medium",
                  activeMode === 'image'
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <Image className="h-4 w-4 inline mr-2" />
                Image Mode
              </button>
              <button
                onClick={() => setActiveMode('video')}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-r-md",
                  activeMode === 'video'
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <Video className="h-4 w-4 inline mr-2" />
                Video Mode
              </button>
            </div>
          </div>

          {/* Prompt Generator Component */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <PromptGenerator 
              onGenerate={handlePromptGenerated} 
              mode={activeMode} 
            />

            {/* Algorithm Button */}
            <div className="mt-4 relative">
              <button
                onClick={() => setShowAlgorithmDropdown(!showAlgorithmDropdown)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Algorithm
                {showAlgorithmDropdown ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </button>
              
              {/* Algorithm Selection Dropdown */}
              {showAlgorithmDropdown && (
                <div className="absolute z-10 mt-2 p-4 bg-white dark:bg-gray-800 rounded-md shadow-lg w-80">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Select Prompt Technique</h3>
                  <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                    {Object.entries(ADVANCED_TECHNIQUES).map(([key, technique]) => (
                      <button
                        key={key}
                        onClick={() => handleAlgorithmSelect(key)}
                        className={`text-left px-3 py-2 text-sm rounded-md ${selectedTechnique === key ? 'bg-purple-100 dark:bg-purple-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{technique.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            technique.complexity === 'simple' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            technique.complexity === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {technique.complexity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{technique.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* External Provider Buttons */}
            {generatedPrompt && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Use with:</h3>
                <div className="flex flex-wrap gap-2">
                  {activeMode === 'text' && textProviders.map(provider => (
                    <button
                      key={provider.name}
                      onClick={() => handleOpenProvider(provider.url, generatedPrompt)}
                      className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {provider.icon}
                      <span className="ml-2">{provider.name}</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  ))}
                  
                  {activeMode === 'image' && imageProviders.map(provider => (
                    <button
                      key={provider.name}
                      onClick={() => handleOpenProvider(provider.url, generatedPrompt)}
                      className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {provider.icon}
                      <span className="ml-2">{provider.name}</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  ))}
                  
                  {activeMode === 'video' && videoProviders.map(provider => (
                    <button
                      key={provider.name}
                      onClick={() => handleOpenProvider(provider.url, generatedPrompt)}
                      className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {provider.icon}
                      <span className="ml-2">{provider.name}</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scroll to Gallery Button */}
          <div className="flex justify-center">
            <button
              onClick={scrollToGallery}
              className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span>View Gallery</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Prompt Gallery Section */}
      <section ref={galleryRef} className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Prompt Gallery
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Explore and discover prompts created by the community
              </p>
            </div>

            {/* Gallery View Selector */}
            <div className="mt-4 md:mt-0">
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  onClick={() => setGalleryView('featured')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-l-md",
                    galleryView === 'featured'
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <Star className="h-4 w-4 inline mr-1" />
                  Featured
                </button>
                <button
                  onClick={() => setGalleryView('newest')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium",
                    galleryView === 'newest'
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <Clock className="h-4 w-4 inline mr-1" />
                  Newest
                </button>
                <button
                  onClick={() => setGalleryView('popular')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-r-md",
                    galleryView === 'popular'
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Popular
                </button>
              </div>
            </div>
          </div>

          {/* Popular Tags */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              entries.map(entry => (
                <motion.div
                  key={entry.id}
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer"
                  onClick={() => handleCardClick(entry)}
                >
                  {/* Card Media (would show the generated output) */}
                  <div className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {entry.output_type === 'image' ? (
                      <img 
                        src={entry.output_url || '/placeholder-image.jpg'} 
                        alt="Generated output" 
                        className="w-full h-full object-cover"
                      />
                    ) : entry.output_type === 'video' ? (
                      <div className="flex items-center justify-center w-full h-full">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-gray-600 dark:text-gray-300 overflow-hidden line-clamp-6">
                        {entry.optimized_prompt || 'Text output'}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                          {entry.user_avatar ? (
                            <img src={entry.user_avatar} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 m-1 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                        <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                          {entry.user_name || 'Anonymous'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {entry.original_prompt || 'Prompt'}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(entry.id);
                          }}
                          className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Heart className={cn(
                            "h-4 w-4 mr-1",
                            userLikes[entry.id] ? "fill-red-500 text-red-500" : ""  
                          )} />
                          {entry.likes_count || 0}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPrompt(entry.optimized_prompt || '');
                          }}
                          className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </button>
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          {entry.views_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Load More */}
          {!isLoading && entries.length > 0 && (
            <div ref={observerTarget} className="flex justify-center mt-8">
              {isLoadingMore ? (
                <Loader className="h-6 w-6 text-gray-400 animate-spin" />
              ) : hasMore ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Scroll for more</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No more prompts to load</p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && entries.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No prompts found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Be the first to share your prompts with the community!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Prompt Detail Modal */}
      <AnimatePresence>
        {showModal && selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Prompt Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before/After Media */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Generated Output</h4>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-md h-64 flex items-center justify-center">
                      {selectedEntry.output_type === 'image' ? (
                        <img 
                          src={selectedEntry.output_url || '/placeholder-image.jpg'} 
                          alt="Generated output" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : selectedEntry.output_type === 'video' ? (
                        <div className="flex items-center justify-center w-full h-full">
                          <Video className="h-16 w-16 text-gray-400" />
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-gray-600 dark:text-gray-300 overflow-auto max-h-full">
                          {selectedEntry.optimized_prompt || 'Text output'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prompt Details */}
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original Prompt</h4>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 text-sm text-gray-800 dark:text-gray-200">
                        {selectedEntry.original_prompt}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Optimized Prompt</h4>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 text-sm text-gray-800 dark:text-gray-200 relative group">
                        {selectedEntry.optimized_prompt}
                        <button
                          onClick={() => handleCopyPrompt(selectedEntry.optimized_prompt || '')}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white dark:bg-gray-800 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metadata</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-2">
                          <span className="text-gray-500 dark:text-gray-400">Created by:</span>
                          <div className="flex items-center mt-1">
                            <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden mr-1">
                              {selectedEntry.user_avatar ? (
                                <img src={selectedEntry.user_avatar} alt="User" className="w-full h-full object-cover" />
                              ) : (
                                <User className="h-3 w-3 m-1 text-gray-500 dark:text-gray-400" />
                              )}
                            </div>
                            <span className="text-gray-800 dark:text-gray-200">
                              {selectedEntry.user_name || 'Anonymous'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-2">
                          <span className="text-gray-500 dark:text-gray-400">Created on:</span>
                          <div className="text-gray-800 dark:text-gray-200 mt-1">
                            {new Date(selectedEntry.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-2">
                          <span className="text-gray-500 dark:text-gray-400">Model:</span>
                          <div className="text-gray-800 dark:text-gray-200 mt-1">
                            {selectedEntry.model_used || 'Unknown'}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-2">
                          <span className="text-gray-500 dark:text-gray-400">Technique:</span>
                          <div className="text-gray-800 dark:text-gray-200 mt-1">
                            {selectedEntry.prompt_type || 'Standard'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => handleLike(selectedEntry.id)}
                          className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Heart className={cn(
                            "h-4 w-4 mr-1",
                            userLikes[selectedEntry.id] ? "fill-red-500 text-red-500" : ""  
                          )} />
                          {selectedEntry.likes_count || 0} Likes
                        </button>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Eye className="h-4 w-4 mr-1" />
                          {selectedEntry.views_count || 0} Views
                        </div>
                      </div>
                      <button 
                        onClick={() => handleOpenProvider(
                          selectedEntry.output_type === 'image' 
                            ? imageProviders[0].url 
                            : selectedEntry.output_type === 'video'
                              ? videoProviders[0].url
                              : textProviders[0].url,
                          selectedEntry.optimized_prompt || ''
                        )}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Try it
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Handle optimize prompt
  const handleOptimizePrompt = async () => {
    if (!promptText.trim()) return;
    
    setIsOptimizing(true);
    
    try {
      // This would call your AI service to optimize the prompt
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Example optimization (in real app, this would come from AI service)
      const optimizedPrompt = `${promptText}\n\nAdd more specific details about lighting, composition, and style. Consider including references to artists or specific techniques.`;
      
      setPromptText(optimizedPrompt);
    } catch (error) {
      console.error('Error optimizing prompt:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage(prevPage => prevPage + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore]);

  // Fetch entries when filters or page changes
  useEffect(() => {
    fetchEntries(true);
  }, [filters]);

  // Load more entries when page changes
  useEffect(() => {
    if (page > 0) {
      fetchEntries(false);
    }
  }, [page]);

  // Load user interactions when entries or user changes
  useEffect(() => {
    if (user && entries.length > 0) {
      loadUserInteractions();
    }
  }, [user, entries.length]);

  return (
    <div className="min-h-screen bg-background-dark text-text-primary">
      {/* Top Section - Prompt Textarea */}
      <section className="w-full py-8 px-4 md:px-6 lg:px-8 border-b border-border-color">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 gradient-text">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary-500" />
                Promptura
              </span>
            </h1>
            <p className="text-text-secondary text-lg">
              Master the art of prompting. Create, optimize, and discover amazing prompts.
            </p>
          </div>
          
          <div className="glass p-6 rounded-xl">
            <div className="mb-4">
              <label htmlFor="prompt-textarea" className="block text-sm font-medium text-text-secondary mb-2">
                Your Prompt
              </label>
              <textarea
                id="prompt-textarea"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Enter your prompt here to optimize it or create something amazing..."
                className="w-full min-h-[120px] bg-neutral-800/50 border border-border-color rounded-lg p-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                className="btn btn-secondary flex items-center gap-2"
                onClick={() => setPromptText('')}
                disabled={!promptText.trim()}
              >
                <X size={16} />
                Clear
              </button>
              <button
                className="btn btn-primary flex items-center gap-2"
                onClick={handleOptimizePrompt}
                disabled={!promptText.trim() || isOptimizing}
              >
                {isOptimizing ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {isOptimizing ? 'Optimizing...' : 'Optimize Prompt'}
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Scrollable Content Section - Prompt Library */}
      <section className="w-full py-8 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                Prompt Library
              </h2>
              <p className="text-text-secondary">
                Discover and use amazing prompts created by the community
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubmissionMode(true)}
                className="btn btn-primary flex items-center gap-2"
                disabled={!user}
              >
                <Plus size={18} />
                Submit Prompt
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="glass p-6 rounded-xl mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search prompts, tags, or creators..."
                  className="w-full bg-neutral-800/50 border border-border-color rounded-lg py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.search || ''}
                  onChange={handleSearch}
                />
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <span className="text-text-secondary text-sm">Sort by:</span>
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleSortChange(e.target.value as any)}
                  className="bg-neutral-800/50 border border-border-color rounded-lg py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="recent">Recent</option>
                  <option value="likes">Most Liked</option>
                  <option value="views">Most Viewed</option>
                  <option value="saves">Most Saved</option>
                  <option value="trending">Trending</option>
                </select>
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagSelect(tag)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full transition-colors",
                    filters.tags?.includes(tag)
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          
          {/* Featured Prompts */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured
              </h3>
              <a href="#" className="text-primary-500 text-sm hover:underline flex items-center gap-1">
                View all
                <ChevronRight size={16} />
              </a>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="h-8 w-8 text-primary-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="glass p-6 rounded-xl text-center">
                <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                  Error loading prompts
                </h3>
                <p className="text-text-secondary mb-4">{error}</p>
                <button
                  onClick={() => fetchEntries(true)}
                  className="btn btn-primary"
                >
                  Try Again
                </button>
              </div>
            ) : entries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {entries
                  .filter(entry => entry.is_featured)
                  .slice(0, 3)
                  .map((entry, index) => (
                    <PromptLibraryCard
                      key={entry.id}
                      entry={entry}
                      index={index}
                      viewMode="grid"
                      isLiked={userLikes[entry.id] || false}
                      isSaved={userSaves[entry.id] || false}
                      onLike={() => handleLike(entry.id)}
                      onSave={() => handleSave(entry.id)}
                      onCopy={() => handleCopyPrompt(entry.prompt_text)}
                      onClick={() => setSelectedEntry(entry)}
                      currentUser={user}
                    />
                  ))}
              </div>
            ) : (
              <div className="glass p-6 rounded-xl text-center">
                <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                  No featured prompts yet
                </h3>
                <p className="text-text-secondary mb-4">
                  Be the first to submit a featured prompt!
                </p>
                {user && (
                  <button
                    onClick={() => setSubmissionMode(true)}
                    className="btn btn-primary"
                  >
                    Submit a Prompt
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Newest Prompts */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Newest
              </h3>
              <a href="#" className="text-primary-500 text-sm hover:underline flex items-center gap-1">
                View all
                <ChevronRight size={16} />
              </a>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="h-8 w-8 text-primary-500 animate-spin" />
              </div>
            ) : entries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {entries
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 3)
                  .map((entry, index) => (
                    <PromptLibraryCard
                      key={entry.id}
                      entry={entry}
                      index={index}
                      viewMode="grid"
                      isLiked={userLikes[entry.id] || false}
                      isSaved={userSaves[entry.id] || false}
                      onLike={() => handleLike(entry.id)}
                      onSave={() => handleSave(entry.id)}
                      onCopy={() => handleCopyPrompt(entry.prompt_text)}
                      onClick={() => setSelectedEntry(entry)}
                      currentUser={user}
                    />
                  ))}
              </div>
            ) : (
              <div className="glass p-6 rounded-xl text-center">
                <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                  No prompts yet
                </h3>
                <p className="text-text-secondary mb-4">
                  Be the first to submit a prompt!
                </p>
                {user && (
                  <button
                    onClick={() => setSubmissionMode(true)}
                    className="btn btn-primary"
                  >
                    Submit a Prompt
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Popular Prompts */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Popular
              </h3>
              <a href="#" className="text-primary-500 text-sm hover:underline flex items-center gap-1">
                View all
                <ChevronRight size={16} />
              </a>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="h-8 w-8 text-primary-500 animate-spin" />
              </div>
            ) : entries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {entries
                  .sort((a, b) => b.likes_count - a.likes_count)
                  .slice(0, 3)
                  .map((entry, index) => (
                    <PromptLibraryCard
                      key={entry.id}
                      entry={entry}
                      index={index}
                      viewMode="grid"
                      isLiked={userLikes[entry.id] || false}
                      isSaved={userSaves[entry.id] || false}
                      onLike={() => handleLike(entry.id)}
                      onSave={() => handleSave(entry.id)}
                      onCopy={() => handleCopyPrompt(entry.prompt_text)}
                      onClick={() => setSelectedEntry(entry)}
                      currentUser={user}
                    />
                  ))}
              </div>
            ) : (
              <div className="glass p-6 rounded-xl text-center">
                <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                  No popular prompts yet
                </h3>
                <p className="text-text-secondary mb-4">
                  Be the first to submit a popular prompt!
                </p>
                {user && (
                  <button
                    onClick={() => setSubmissionMode(true)}
                    className="btn btn-primary"
                  >
                    Submit a Prompt
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Load More */}
          {hasMore && entries.length > 0 && (
            <div
              ref={observerTarget}
              className="flex justify-center items-center py-8"
            >
              {isLoadingMore ? (
                <Loader className="h-8 w-8 text-primary-500 animate-spin" />
              ) : (
                <button
                  onClick={() => setPage(prevPage => prevPage + 1)}
                  className="btn btn-secondary"
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      
      {/* Submission Modal */}
      <AnimatePresence>
        {submissionMode && (
          <PromptLibrarySubmissionModal
            onClose={() => setSubmissionMode(false)}
            onSubmit={() => {
              setSubmissionMode(false);
              fetchEntries(true);
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Entry Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEntry(null)}
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
                      {selectedEntry.author_avatar}
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-text-primary">{selectedEntry.title}</h2>
                      <p className="text-text-secondary">
                        by {selectedEntry.author_username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Before/After Images */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedEntry.before_image_url && (
                        <div>
                          <h3 className="text-lg font-display font-bold mb-3">Before</h3>
                          <div className="aspect-square rounded-lg overflow-hidden bg-neutral-900">
                            <img
                              src={selectedEntry.before_image_url}
                              alt="Before"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-display font-bold mb-3">After</h3>
                        <div className="aspect-square rounded-lg overflow-hidden bg-neutral-900">
                          <img
                            src={selectedEntry.after_image_url}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary-500" />
                        Description
                      </h3>
                      <p className="text-text-secondary leading-relaxed">{selectedEntry.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <Award className="h-5 w-5 text-accent-500" />
                        Prompt Used
                      </h3>
                      <div className="glass p-4 rounded-lg relative group">
                        <pre className="text-text-primary whitespace-pre-wrap text-sm font-mono leading-relaxed">
                          {selectedEntry.prompt_text}
                        </pre>
                        <button
                          onClick={() => handleCopyPrompt(selectedEntry.prompt_text)}
                          className="absolute top-2 right-2 bg-neutral-800/80 text-text-secondary hover:text-text-primary p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    <div className="glass p-4 rounded-lg">
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-purple-500" />
                        Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{selectedEntry.views_count}</div>
                          <div className="text-xs text-text-secondary">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{selectedEntry.likes_count}</div>
                          <div className="text-xs text-text-secondary">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{selectedEntry.saves_count}</div>
                          <div className="text-xs text-text-secondary">Saves</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{selectedEntry.copies_count}</div>
                          <div className="text-xs text-text-secondary">Copies</div>
                        </div>
                      </div>
                    </div>

                    <div className="glass p-4 rounded-lg">
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        Creator
                      </h3>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-lg">
                          {selectedEntry.author_avatar}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{selectedEntry.author_username}</div>
                          <div className="text-xs text-text-secondary">Member since {new Date(selectedEntry.author_joined_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {user && user.id !== selectedEntry.user_id && (
                        <button
                          className="w-full btn btn-secondary btn-sm"
                        >
                          Follow
                        </button>
                      )}
                    </div>

                    <div className="glass p-4 rounded-lg">
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <Tag className="h-5 w-5 text-green-500" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.tags.map((tag) => (
                          <span
                            key={tag}
                            onClick={() => handleTagSelect(tag)}
                            className="text-xs px-2 py-1 bg-neutral-800 text-neutral-300 rounded-full cursor-pointer hover:bg-neutral-700 transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="glass p-4 rounded-lg">
                      <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        Posted
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {new Date(selectedEntry.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLike(selectedEntry.id)}
                        className={cn(
                          "flex-1 btn",
                          userLikes[selectedEntry.id] ? "btn-primary" : "btn-secondary"
                        )}
                      >
                        <Heart size={16} className={userLikes[selectedEntry.id] ? "fill-current" : ""} />
                        {userLikes[selectedEntry.id] ? "Liked" : "Like"}
                      </button>
                      <button
                        onClick={() => handleSave(selectedEntry.id)}
                        className={cn(
                          "flex-1 btn",
                          userSaves[selectedEntry.id] ? "btn-primary" : "btn-secondary"
                        )}
                      >
                        {userSaves[selectedEntry.id] ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        {userSaves[selectedEntry.id] ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrompturaUI;