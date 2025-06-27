import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Copy, Eye, Trash2, Search, Bookmark, Filter } from 'lucide-react';
import LayoutWrapper from '../components/LayoutWrapper';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';

interface PromptHistory {
  id: string;
  original_prompt: string;
  optimized_prompt: string;
  created_at: string;
  model_used: string;
  prompt_type: string;
}

const HistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [prompts, setPrompts] = useState<PromptHistory[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<PromptHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptHistory | null>(null);
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('');
  const [selectedPromptTypeFilter, setSelectedPromptTypeFilter] = useState<string>('');
  const [savedStates, setSavedStates] = useState<{ [key: string]: boolean }>({});
  const [copyStates, setCopyStates] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (currentUser) {
      fetchPrompts();
    }
  }, [currentUser]);

  useEffect(() => {
    // Real-time search functionality
    const filtered = prompts.filter(prompt => {
      const matchesSearch = searchTerm === '' || 
        prompt.original_prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.optimized_prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.model_used.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModel = !selectedModelFilter || prompt.model_used === selectedModelFilter;
      const matchesType = !selectedPromptTypeFilter || prompt.prompt_type === selectedPromptTypeFilter;
      
      return matchesSearch && matchesModel && matchesType;
    });
    
    setFilteredPrompts(filtered);
  }, [prompts, searchTerm, selectedModelFilter, selectedPromptTypeFilter]);

// Replace your existing fetchPrompts function in the history page with this:

const fetchPrompts = async () => {
  try {
    // Fetch regular prompts
    const { data: promptsData, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', currentUser?.id)
      .order('created_at', { ascending: false });

    if (promptsError) throw promptsError;

    // Fetch AB test results
    const { data: abTestData, error: abTestError } = await supabase
      .from('ab_test_results')
      .select('*')
      .eq('user_id', currentUser?.id)
      .order('created_at', { ascending: false });

    if (abTestError) throw abTestError;

    // Fetch model comparison results
    const { data: modelComparisonData, error: modelComparisonError } = await supabase
      .from('model_comparisons')
      .select('*')
      .eq('user_id', currentUser?.id)
      .order('created_at', { ascending: false });

    if (modelComparisonError) throw modelComparisonError;

    // Combine and normalize the data
    const combinedData = [
      // Regular prompts
      ...(promptsData || []),
      
      // AB test results
      ...(abTestData || []).map(abTest => ({
        id: abTest.id,
        original_prompt: abTest.original_prompt,
        optimized_prompt: abTest.optimized_prompt,
        created_at: abTest.created_at,
        model_used: abTest.model_used,
        prompt_type: abTest.prompt_type || 'A/B Test'
      })),
      
      // Model comparison results
      ...(modelComparisonData || []).map(comparison => ({
        id: comparison.id,
        original_prompt: comparison.original_prompt,
        optimized_prompt: comparison.optimized_prompt,
        created_at: comparison.created_at,
        model_used: comparison.winner_model || `${comparison.model_a} vs ${comparison.model_b}${comparison.model_c ? ` vs ${comparison.model_c}` : ''}`,
        prompt_type: comparison.prompt_type || 'Model Comparison',
        // Additional data for model comparisons
        comparison_data: {
          winner_model: comparison.winner_model,
          selected_models: comparison.selected_models,
          metrics: comparison.comparison_metrics
        }
      }))
    ];

    // Sort by created_at descending
    combinedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setPrompts(combinedData);
  } catch (error) {
    console.error('Error fetching prompts:', error);
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

  const handleSavePrompt = async (prompt: PromptHistory) => {
    if (!currentUser) return;
    
    try {
      await supabase.from('saved_prompts').insert({
        user_id: currentUser.id,
        original_prompt: prompt.original_prompt,
        optimized_prompt: prompt.optimized_prompt,
        prompt_type: prompt.prompt_type,
        model_used: prompt.model_used,
        title: prompt.original_prompt.substring(0, 50) + (prompt.original_prompt.length > 50 ? '...' : '')
      });
      
      setSavedStates(prev => ({ ...prev, [prompt.id]: true }));
    } catch (err) {
      console.error('Failed to save prompt:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPrompts(prompts.filter(p => p.id !== id));
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      'Llama 2': '🦙',
      'PaLM 2': '🌴',
      'Cohere Command': '🎯'
    };
    return modelIcons[model] || '';
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
  const uniqueModels = [...new Set(prompts.map(p => p.model_used))].filter(Boolean);
  const uniquePromptTypes = [...new Set(prompts.map(p => p.prompt_type))].filter(Boolean);

  return (
    <LayoutWrapper>
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="max-w-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header with responsive search */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
              <h1 className="heading text-3xl md:text-4xl">History</h1>
              <div className="relative w-full lg:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full lg:w-64"
                />
              </div>
            </div>

            {/* Enhanced Filtering Options - Made responsive */}
            <div className="mb-6 flex flex-col lg:flex-row lg:flex-wrap gap-4 lg:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-400">Filter by:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={selectedModelFilter}
                  onChange={(e) => setSelectedModelFilter(e.target.value)}
                  className="input-field w-full sm:w-auto min-w-[150px]"
                >
                  <option value="">All Models</option>
                  {uniqueModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>

                <select
                  value={selectedPromptTypeFilter}
                  onChange={(e) => setSelectedPromptTypeFilter(e.target.value)}
                  className="input-field w-full sm:w-auto min-w-[150px]"
                >
                  <option value="">All Algorithms</option>
                  {uniquePromptTypes.map(type => (
                    <option key={type} value={type}>
                      {getAlgorithmLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedModelFilter || selectedPromptTypeFilter || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedModelFilter('');
                    setSelectedPromptTypeFilter('');
                    setSearchTerm('');
                  }}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors self-start lg:self-auto"
                >
                  Clear all filters
                </button>
              )}
              
              <div className="text-sm text-neutral-400 lg:ml-auto">
                {filteredPrompts.length} of {prompts.length} prompts
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredPrompts.length > 0 ? (
              <div className="space-y-4">
                {filteredPrompts.map((prompt) => (
                  <motion.div
                    key={prompt.id}
                    className="glass rounded-xl p-4 lg:p-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                  >
                    {/* Mobile-first responsive layout */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="text-2xl flex-shrink-0">{getModelIcon(prompt.model_used)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-primary-400 truncate">
                              {prompt.model_used}
                            </span>
                            <span className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full w-fit">
                              {getAlgorithmLabel(prompt.prompt_type)}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-400">
                            {formatDate(prompt.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Responsive action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 justify-end">
                        <button
                          onClick={() => setSelectedPrompt(prompt)}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSavePrompt(prompt)}
                          disabled={savedStates[prompt.id]}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            savedStates[prompt.id]
                              ? "bg-success-500/20 text-success-500 cursor-not-allowed"
                              : "hover:bg-white/5"
                          )}
                          title="Save prompt"
                        >
                          <Bookmark className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(prompt.optimized_prompt, prompt.id)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            copyStates[prompt.id]
                              ? "bg-success-500/20 text-success-500"
                              : "hover:bg-white/5"
                          )}
                          title="Copy optimized prompt"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="p-2 hover:bg-error-500/20 text-error-500 rounded-lg transition-colors"
                          title="Delete prompt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-neutral-400 mb-1">Original Prompt</p>
                        <p className="text-neutral-300 text-sm break-words">
                          {prompt.original_prompt.length > 150 
                            ? prompt.original_prompt.substring(0, 150) + '...'
                            : prompt.original_prompt
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-400 mb-1">Optimized Prompt</p>
                        <p className="text-white text-sm break-words">
                          {prompt.optimized_prompt.length > 200 
                            ? prompt.optimized_prompt.substring(0, 200) + '...'
                            : prompt.optimized_prompt
                          }
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-xl p-12 text-center">
                <p className="text-neutral-400 mb-4">
                  {searchTerm || selectedModelFilter || selectedPromptTypeFilter 
                    ? 'No prompts found matching your search criteria.' 
                    : 'No prompt history found.'
                  }
                </p>
                {!searchTerm && !selectedModelFilter && !selectedPromptTypeFilter && (
                  <p className="text-neutral-500">
                    Start generating optimized prompts to see them here!
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Enhanced Prompt Detail Modal */}
      {selectedPrompt && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedPrompt(null)}
        >
          <motion.div
            className="glass rounded-xl p-4 lg:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="text-2xl flex-shrink-0">{getModelIcon(selectedPrompt.model_used)}</div>
                <div className="min-w-0">
                  <h3 className="text-xl font-display font-bold truncate">{selectedPrompt.model_used}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full w-fit">
                      {getAlgorithmLabel(selectedPrompt.prompt_type)}
                    </span>
                    <p className="text-sm text-neutral-400">{formatDate(selectedPrompt.created_at)}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="text-neutral-400 hover:text-white flex-shrink-0 self-start lg:self-auto"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-neutral-400 mb-2">Original Prompt</h4>
                <div className="glass p-4 rounded-lg">
                  <p className="text-neutral-300 whitespace-pre-wrap break-words">{selectedPrompt.original_prompt}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-neutral-400 mb-2">Optimized Prompt</h4>
                <div className="glass p-4 rounded-lg">
                  <p className="text-white whitespace-pre-wrap break-words">{selectedPrompt.optimized_prompt}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleCopy(selectedPrompt.optimized_prompt, selectedPrompt.id)}
                  className="btn btn-primary flex items-center justify-center gap-2 flex-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy Optimized Prompt
                </button>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="btn btn-secondary flex-1 sm:flex-initial"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </LayoutWrapper>
  );
};

export default HistoryPage;