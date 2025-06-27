import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { History, Star, Settings, Copy, Bookmark, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import LayoutWrapper from '../components/LayoutWrapper';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';

interface RecentPrompt {
  id: string;
  original_prompt: string;
  optimized_prompt: string;
  created_at: string;
  model_used: string;
  prompt_type: string;
  source_page?: string;
}

interface SavedPrompt {
  id: string;
  title: string;
  original_prompt: string;
  optimized_prompt: string;
  created_at: string;
  model_used: string;
  prompt_type: string;
}

interface DashboardStats {
  totalPrompts: number;
  savedPrompts: number;
  thisWeekPrompts: number;
}

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [recentPrompts, setRecentPrompts] = useState<RecentPrompt[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPrompts: 0,
    savedPrompts: 0,
    thisWeekPrompts: 0
  });
  const [loading, setLoading] = useState(true);
  const [savedStates, setSavedStates] = useState<{ [key: string]: boolean }>({});
  const [copyStates, setCopyStates] = useState<{ [key: string]: boolean }>({});
  const [selectedPrompt, setSelectedPrompt] = useState<RecentPrompt | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentPrompts(),
        fetchSavedPrompts()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();

      // Get counts from all tables
      const [promptsCount, abTestCount, compareCount, savedCount] = await Promise.all([
        // Regular prompts - total and this week
        Promise.all([
          supabase
            .from('prompts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUser?.id),
          supabase
            .from('prompts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUser?.id)
            .gte('created_at', weekAgoISO)
        ]),
        
        // A/B Test results - total and this week
        Promise.all([
          supabase
            .from('ab_test_results')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUser?.id),
          supabase
            .from('ab_test_results')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUser?.id)
            .gte('created_at', weekAgoISO)
        ]),
        
        // Compare models results - total and this week
        Promise.all([
          supabase
            .from('model_comparisons')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUser?.id),
          supabase
            .from('model_comparisons')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUser?.id)
            .gte('created_at', weekAgoISO)
        ]),
        
        // Saved prompts count
        supabase
          .from('saved_prompts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', currentUser?.id)
      ]);

      // Calculate totals
      const totalPrompts = 
        (promptsCount[0].count || 0) + 
        (abTestCount[0].count || 0) + 
        (compareCount[0].count || 0);

      const thisWeekPrompts = 
        (promptsCount[1].count || 0) + 
        (abTestCount[1].count || 0) + 
        (compareCount[1].count || 0);

      const savedPromptsCount = savedCount.count || 0;

      setStats({
        totalPrompts,
        savedPrompts: savedPromptsCount,
        thisWeekPrompts
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchRecentPrompts = async () => {
    try {
      // Fetch from all possible sources (limit each to prevent too much data)
      const [promptsResult, abTestResult, compareResult] = await Promise.all([
        // Regular prompts
        supabase
          .from('prompts')
          .select('*')
          .eq('user_id', currentUser?.id)
          .order('created_at', { ascending: false })
          .limit(20), // Get more to have a good mix after combining
        
        // A/B Test results
        supabase
          .from('ab_test_results')
          .select('*')
          .eq('user_id', currentUser?.id)
          .order('created_at', { ascending: false })
          .limit(20)
          .then(result => ({
            ...result,
            data: result.data?.map(item => ({
              ...item,
              source_page: 'A/B Testing'
            }))
          })),
        
        // Compare models results
        supabase
          .from('model_comparisons')
          .select('*')
          .eq('user_id', currentUser?.id)
          .order('created_at', { ascending: false })
          .limit(20)
          .then(result => ({
            ...result,
            data: result.data?.map(item => ({
              ...item,
              source_page: 'Compare Models'
            }))
          }))
      ]);

      // Combine all results
      const allPrompts = [
        ...(promptsResult.data || []).map(p => ({ ...p, source_page: 'Prompt Generator' })),
        ...(abTestResult.data || []),
        ...(compareResult.data || [])
      ];

      // Sort by created_at and limit to recent ones for display
      const sortedPrompts = allPrompts
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10); // Show 10 most recent for the UI

      setRecentPrompts(sortedPrompts);
    } catch (error) {
      console.error('Error fetching recent prompts:', error);
    }
  };

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

  const handleSavePrompt = async (prompt: RecentPrompt) => {
    if (!currentUser) return;
    
    try {
      // Check if already saved
      const { data: existing } = await supabase
        .from('saved_prompts')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('original_prompt', prompt.original_prompt)
        .single();

      if (existing) {
        setSavedStates(prev => ({ ...prev, [prompt.id]: true }));
        return;
      }

      const { error } = await supabase.from('saved_prompts').insert({
        user_id: currentUser.id,
        original_prompt: prompt.original_prompt,
        optimized_prompt: prompt.optimized_prompt,
        prompt_type: prompt.prompt_type,
        model_used: prompt.model_used,
        title: prompt.original_prompt.substring(0, 50) + (prompt.original_prompt.length > 50 ? '...' : '')
      });

      if (error) throw error;
      
      setSavedStates(prev => ({ ...prev, [prompt.id]: true }));
      // Refresh both saved prompts and stats
      await Promise.all([fetchSavedPrompts(), fetchDashboardStats()]);
    } catch (err) {
      console.error('Failed to save prompt:', err);
    }
  };

  const handleDelete = async (prompt: RecentPrompt) => {
    try {
      let tableName = 'prompts';
      
      // Determine which table to delete from based on source
      switch (prompt.source_page) {
        case 'A/B Testing':
          tableName = 'ab_test_results';
          break;
        case 'Compare Models':
          tableName = 'model_comparisons';
          break;
        default:
          tableName = 'prompts';
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', prompt.id);

      if (error) throw error;
      
      setRecentPrompts(prompts => prompts.filter(p => p.id !== prompt.id));
      if (selectedPrompt?.id === prompt.id) {
        setSelectedPrompt(null);
      }
      
      // Refresh stats after deletion
      await fetchDashboardStats();
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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
      'Mistral': '🌪️'
    };
    return modelIcons[model] || '🤖';
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

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'A/B Testing':
        return '🧪';
      case 'Compare Models':
        return '⚖️';
      case 'Prompt Generator':
        return '✨';
      default:
        return '✨';
    }
  };

  return (
    <LayoutWrapper>
      <div className="flex-1 pt-20 p-6 overflow-y-auto">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <h1 className="heading text-3xl md:text-4xl">
              Welcome back, {currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0]}!
            </h1>

            {/* Stats Cards - Now using proper counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass p-4 rounded-xl">
                <h3 className="text-sm text-neutral-400 mb-1">Total Prompts</h3>
                <p className="text-2xl font-bold text-white">{stats.totalPrompts}</p>
              </div>
              <div className="glass p-4 rounded-xl">
                <h3 className="text-sm text-neutral-400 mb-1">Saved Prompts</h3>
                <p className="text-2xl font-bold text-accent-400">{stats.savedPrompts}</p>
              </div>
              <div className="glass p-4 rounded-xl">
                <h3 className="text-sm text-neutral-400 mb-1">This Week</h3>
                <p className="text-2xl font-bold text-primary-400">{stats.thisWeekPrompts}</p>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link to="/dashboard/history" className="glass p-6 rounded-xl hover:bg-white/5 transition-colors group">
                <History className="h-8 w-8 text-primary-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-display font-bold mb-2">Prompt History</h3>
                <p className="text-neutral-400 mb-4">View and reuse your previous prompts</p>
                <div className="btn btn-secondary w-full">View History</div>
              </Link>

              <Link to="/dashboard/saved" className="glass p-6 rounded-xl hover:bg-white/5 transition-colors group">
                <Star className="h-8 w-8 text-accent-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-display font-bold mb-2">Saved Prompts</h3>
                <p className="text-neutral-400 mb-4">Access your favorite prompt templates</p>
                <div className="btn btn-secondary w-full">View Saved</div>
              </Link>

              <Link to="/dashboard/settings" className="glass p-6 rounded-xl hover:bg-white/5 transition-colors group">
                <Settings className="h-8 w-8 text-violet-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-display font-bold mb-2">Settings</h3>
                <p className="text-neutral-400 mb-4">Manage your account preferences</p>
                <div className="btn btn-secondary w-full">Open Settings</div>
              </Link>
            </div>

            {/* Recent Activity section */}
            {recentPrompts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-display font-bold text-white">Recent Activity</h2>
                  <Link 
                    to="/dashboard/history" 
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    View All
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {recentPrompts.slice(0, 5).map((prompt) => (
                    <div
                      key={prompt.id}
                      className="glass p-4 rounded-lg hover:bg-white/2 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <div className="text-xl flex-shrink-0">{getModelIcon(prompt.model_used)}</div>
                            <div className="text-sm flex-shrink-0">{getSourceIcon(prompt.source_page)}</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium text-primary-400 flex-shrink-0">
                                {prompt.model_used}
                              </span>
                              <span className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full flex-shrink-0">
                                {getAlgorithmLabel(prompt.prompt_type)}
                              </span>
                              {prompt.source_page && (
                                <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full flex-shrink-0">
                                  {prompt.source_page}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-400">
                              {formatDate(prompt.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                          <button
                            onClick={() => setSelectedPrompt(prompt)}
                            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-background-dark hover:bg-background-light text-neutral-300 transition-colors min-w-0"
                            title="View full prompt"
                          >
                            <Eye className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="hidden xs:inline whitespace-nowrap">View</span>
                          </button>
                          
                          <button
                            onClick={() => handleCopy(prompt.optimized_prompt, prompt.id)}
                            className={cn(
                              "flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-300 min-w-0",
                              copyStates[prompt.id]
                                ? "bg-success-500/20 text-success-500"
                                : "bg-background-dark hover:bg-background-light text-neutral-300"
                            )}
                            title="Copy optimized prompt"
                          >
                            <Copy className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="hidden xs:inline whitespace-nowrap">
                              {copyStates[prompt.id] ? 'Copied!' : 'Copy'}
                            </span>
                          </button>
                          
                          <button
                            onClick={() => handleSavePrompt(prompt)}
                            disabled={savedStates[prompt.id]}
                            className={cn(
                              "flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-300 min-w-0",
                              savedStates[prompt.id]
                                ? "bg-success-500/20 text-success-500 cursor-not-allowed"
                                : "bg-background-dark hover:bg-background-light text-neutral-300"
                            )}
                            title="Save prompt"
                          >
                            <Bookmark className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="hidden xs:inline whitespace-nowrap">
                              {savedStates[prompt.id] ? 'Saved!' : 'Save'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleDelete(prompt)}
                            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-error-500/20 text-error-500 hover:bg-error-500/30 transition-colors min-w-0"
                            title="Delete prompt"
                          >
                            <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="hidden xs:inline whitespace-nowrap">Delete</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-neutral-400 mb-1">Original Prompt</p>
                          <p className="text-neutral-300 text-sm leading-relaxed break-words">
                            {prompt.original_prompt.length > 80 
                              ? prompt.original_prompt.substring(0, 80) + '...'
                              : prompt.original_prompt
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-neutral-400 mb-1">Optimized Prompt</p>
                          <p className="text-white text-sm leading-relaxed break-words">
                            {prompt.optimized_prompt.length > 120 
                              ? prompt.optimized_prompt.substring(0, 120) + '...'
                              : prompt.optimized_prompt
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when no recent prompts */}
            {recentPrompts.length === 0 && !loading && (
              <div className="glass p-8 rounded-xl text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-display font-bold mb-2">No recent activity</h3>
                <p className="text-neutral-400 mb-4">
                  Start by creating your first optimized prompt to see it here.
                </p>
                <Link to="/" className="btn btn-primary">
                  Create First Prompt
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Prompt Detail Modal */}
      {selectedPrompt && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedPrompt(null)}
        >
          <motion.div
            className="glass rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="text-2xl">{getModelIcon(selectedPrompt.model_used)}</div>
                  <div className="text-lg">{getSourceIcon(selectedPrompt.source_page)}</div>
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">{selectedPrompt.model_used}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full">
                      {getAlgorithmLabel(selectedPrompt.prompt_type)}
                    </span>
                    {selectedPrompt.source_page && (
                      <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full">
                        {selectedPrompt.source_page}
                      </span>
                    )}
                    <p className="text-sm text-neutral-400">{formatDate(selectedPrompt.created_at)}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="text-neutral-400 hover:text-white transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-neutral-400 mb-2">Original Prompt</h4>
                <div className="glass p-4 rounded-lg">
                  <p className="text-neutral-300 whitespace-pre-wrap">{selectedPrompt.original_prompt}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-neutral-400 mb-2">Optimized Prompt</h4>
                <div className="glass p-4 rounded-lg">
                  <p className="text-white whitespace-pre-wrap">{selectedPrompt.optimized_prompt}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleCopy(selectedPrompt.optimized_prompt, selectedPrompt.id)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Optimized Prompt
                </button>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="btn btn-secondary"
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

export default DashboardPage;