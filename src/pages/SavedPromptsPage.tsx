import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Copy, Trash2, Search, Star, StarOff, Filter, Eye, GitBranch } from 'lucide-react';
import LayoutWrapper from '../components/LayoutWrapper';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';
import { PromptVersioning } from '../components/versioning/PromptVersioning';
import type { PromptVersion } from '../lib/supabase';

interface SavedPrompt {
  id: string;
  title: string;
  original_prompt: string;
  optimized_prompt: string;
  created_at: string;
  model_used: string;
  prompt_type: string;
  is_favorite: boolean;
}

const SavedPromptsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('');
  const [selectedPromptTypeFilter, setSelectedPromptTypeFilter] = useState<string>('');
  const [copyStates, setCopyStates] = useState<{ [key: string]: boolean }>({});
  const [selectedPrompt, setSelectedPrompt] = useState<SavedPrompt | null>(null);
  const [versioningPrompt, setVersioningPrompt] = useState<SavedPrompt | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchSavedPrompts();
    }
  }, [currentUser]);

  const fetchSavedPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_prompts')
        .select('*')
        .eq('user_id', currentUser?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedPrompts(data || []);
    } catch (error) {
      console.error('Error fetching saved prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, promptId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStates(prev => ({ ...prev, [promptId]: true }));
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [promptId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleToggleFavorite = async (promptId: string, currentFavoriteStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_prompts')
        .update({ is_favorite: !currentFavoriteStatus })
        .eq('id', promptId);

      if (error) throw error;
      
      setSavedPrompts(prev => 
        prev.map(prompt => 
          prompt.id === promptId 
            ? { ...prompt, is_favorite: !currentFavoriteStatus }
            : prompt
        )
      );
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSavedPrompts(savedPrompts.filter(p => p.id !== id));
      
      // Close modals if the deleted prompt was being viewed
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
      }
      if (versioningPrompt?.id === id) {
        setVersioningPrompt(null);
      }
    } catch (error) {
      console.error('Error deleting saved prompt:', error);
    }
  };

  const handleVersionChange = (version: PromptVersion) => {
    // Update the prompt in the list with the new version data
    setSavedPrompts(prev => 
      prev.map(prompt => 
        prompt.id === version.prompt_id 
          ? { 
              ...prompt, 
              title: version.title,
              optimized_prompt: version.content,
              updated_at: version.updated_at
            }
          : prompt
      )
    );
    
    // Update selected prompt if it's the same one
    if (selectedPrompt?.id === version.prompt_id) {
      setSelectedPrompt(prev => prev ? {
        ...prev,
        title: version.title,
        optimized_prompt: version.content
      } : null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getModelIcon = (model: string) => {
    const modelIcons: { [key: string]: string } = {
      'GPT-4': '🤖',
      'Claude 3': '🧠',
      'DeepSeek': '🔍',
      'Gemini': '💎',
      'Grok': '⚡',
      'Perplexity': '🔎',
      'Midjourney': '🎨',
      'Mistral': '🌪️',
      'general': '✨'
    };
    return modelIcons[model] || '✨';
  };

  const getAlgorithmLabel = (promptType: string) => {
    switch (promptType) {
      case 'role-based':
        return 'PRIMER';
      case 'chain-of-thought':
        return 'PRO';
      case 'constraint-based':
        return 'ULTRA';
      default:
        return 'General';
    }
  };

  // Get unique values for filters
  const uniqueModels = [...new Set(savedPrompts.map(p => p.model_used))].filter(Boolean);
  const uniquePromptTypes = [...new Set(savedPrompts.map(p => p.prompt_type))].filter(Boolean);

  const filteredPrompts = savedPrompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.optimized_prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.original_prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = !selectedModelFilter || prompt.model_used === selectedModelFilter;
    const matchesType = !selectedPromptTypeFilter || prompt.prompt_type === selectedPromptTypeFilter;
    
    return matchesSearch && matchesModel && matchesType;
  });

  return (
    <LayoutWrapper>
      <div className="pt-32 pb-20 px-4 md:px-6">
        <div className="container mx-auto">
          <motion.div
            className="max-w-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header with responsive search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h1 className="heading text-3xl md:text-4xl">Saved Prompts</h1>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search saved prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>

            {/* Responsive Filtering Options */}
            <div className="mb-6 flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-400">Filter by:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <select
                  value={selectedModelFilter}
                  onChange={(e) => setSelectedModelFilter(e.target.value)}
                  className="input-field w-full sm:w-auto sm:min-w-[150px]"
                >
                  <option value="">All Models</option>
                  {uniqueModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>

                <select
                  value={selectedPromptTypeFilter}
                  onChange={(e) => setSelectedPromptTypeFilter(e.target.value)}
                  className="input-field w-full sm:w-auto sm:min-w-[150px]"
                >
                  <option value="">All Types</option>
                  {uniquePromptTypes.map(type => (
                    <option key={type} value={type}>
                      {getAlgorithmLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:ml-auto">
                {(selectedModelFilter || selectedPromptTypeFilter) && (
                  <button
                    onClick={() => {
                      setSelectedModelFilter('');
                      setSelectedPromptTypeFilter('');
                    }}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
                
                <div className="text-sm text-neutral-400">
                  {filteredPrompts.length} of {savedPrompts.length} prompts
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredPrompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredPrompts.map((prompt) => (
                  <motion.div
                    key={prompt.id}
                    className="glass rounded-xl p-4 sm:p-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFavorite(prompt.id, prompt.is_favorite)}
                          className={cn(
                            "p-1 rounded transition-colors flex-shrink-0",
                            prompt.is_favorite 
                              ? "text-yellow-500 hover:text-yellow-400" 
                              : "text-neutral-400 hover:text-yellow-500"
                          )}
                          title={prompt.is_favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          {prompt.is_favorite ? <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-current" /> : <StarOff className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </button>
                        <div className="text-base sm:text-lg">{getModelIcon(prompt.model_used)}</div>
                      </div>
                      
                      {/* Action buttons - responsive layout */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedPrompt(prompt)}
                          className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                          title="View prompt details"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => setVersioningPrompt(prompt)}
                          className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                          title="Version History"
                        >
                          <GitBranch className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(prompt.optimized_prompt, prompt.id)}
                          className={cn(
                            "p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0",
                            copyStates[prompt.id]
                              ? "bg-success-500/20 text-success-500"
                              : "hover:bg-white/5"
                          )}
                          title="Copy optimized prompt"
                        >
                          <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="p-1.5 sm:p-2 hover:bg-error-500/20 text-error-500 rounded-lg transition-colors flex-shrink-0"
                          title="Delete prompt"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-display font-bold mb-2 text-sm sm:text-base break-words line-clamp-2">{prompt.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3">
                      <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full">
                        {prompt.model_used}
                      </span>
                      {prompt.prompt_type && (
                        <span className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full">
                          {getAlgorithmLabel(prompt.prompt_type)}
                        </span>
                      )}
                    </div>

                    <p className="text-neutral-300 text-xs sm:text-sm mb-4 line-clamp-3 break-words">
                      {prompt.optimized_prompt.length > 120 
                        ? prompt.optimized_prompt.substring(0, 120) + '...'
                        : prompt.optimized_prompt
                      }
                    </p>

                    <p className="text-xs text-neutral-400">
                      Saved {formatDate(prompt.created_at)}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-xl p-8 sm:p-12 text-center">
                <Star className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 mb-4">
                  {searchTerm || selectedModelFilter || selectedPromptTypeFilter 
                    ? 'No saved prompts found matching your filters.' 
                    : 'No saved prompts yet.'
                  }
                </p>
                {!searchTerm && !selectedModelFilter && !selectedPromptTypeFilter && (
                  <p className="text-neutral-500">
                    Save your favorite optimized prompts to access them quickly later!
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Responsive Prompt Detail Modal */}
      {selectedPrompt && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedPrompt(null)}
        >
          <motion.div
            className="glass rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="text-xl sm:text-2xl flex-shrink-0">{getModelIcon(selectedPrompt.model_used)}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-display font-bold break-words">{selectedPrompt.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full">
                      {selectedPrompt.model_used}
                    </span>
                    <span className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full">
                      {getAlgorithmLabel(selectedPrompt.prompt_type)}
                    </span>
                    <p className="text-sm text-neutral-400">{formatDate(selectedPrompt.created_at)}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="text-neutral-400 hover:text-white text-xl flex-shrink-0 self-start sm:self-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-neutral-400 mb-2">Original Prompt</h4>
                <div className="glass p-3 sm:p-4 rounded-lg">
                  <p className="text-neutral-300 whitespace-pre-wrap text-sm break-words">{selectedPrompt.original_prompt}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-neutral-400 mb-2">Optimized Prompt</h4>
                <div className="glass p-3 sm:p-4 rounded-lg">
                  <p className="text-white whitespace-pre-wrap text-sm break-words">{selectedPrompt.optimized_prompt}</p>
                </div>
              </div>

              {/* Responsive modal buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleCopy(selectedPrompt.optimized_prompt, selectedPrompt.id)}
                  className={cn(
                    "btn btn-primary flex items-center justify-center gap-2 text-sm",
                    copyStates[selectedPrompt.id] && "bg-success-500/20 text-success-500"
                  )}
                >
                  <Copy className="h-4 w-4" />
                  {copyStates[selectedPrompt.id] ? 'Copied!' : 'Copy Optimized Prompt'}
                </button>
                <button
                  onClick={() => handleCopy(selectedPrompt.original_prompt, selectedPrompt.id)}
                  className="btn btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <Copy className="h-4 w-4" />
                  Copy Original Prompt
                </button>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="btn btn-secondary text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Prompt Versioning Modal */}
      {versioningPrompt && (
        <PromptVersioning
          prompt={versioningPrompt}
          onClose={() => setVersioningPrompt(null)}
          onVersionChange={handleVersionChange}
        />
      )}
    </LayoutWrapper>
  );
};

export default SavedPromptsPage;