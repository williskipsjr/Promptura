import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Moon, Sun, Palette, Zap } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import { supabase } from '../lib/supabase';

interface TokenUsage {
  total_tokens: number;
  monthly_tokens: number;
  extra_tokens: number;
}

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    total_tokens: 0,
    monthly_tokens: 0,
    extra_tokens: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load theme from localStorage on component mount
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    }

    if (currentUser) {
      fetchTokenUsage();
    }
  }, [currentUser]);

  const fetchTokenUsage = async () => {
    try {
      // Simulate token usage data - in a real app, this would come from your API
      const { data: prompts, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', currentUser?.id);

      if (error) throw error;

      // Calculate approximate token usage (rough estimate)
      const totalPrompts = prompts?.length || 0;
      const estimatedTokensPerPrompt = 150; // Average tokens per prompt
      const totalTokens = totalPrompts * estimatedTokensPerPrompt;

      setTokenUsage({
        total_tokens: totalTokens,
        monthly_tokens: Math.min(totalTokens, 10000), // 10k monthly limit
        extra_tokens: Math.max(0, totalTokens - 10000)
      });
    } catch (error) {
      console.error('Error fetching token usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    // Persist theme to localStorage and apply to document
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const monthlyLimit = 10000;
  const monthlyUsagePercentage = (tokenUsage.monthly_tokens / monthlyLimit) * 100;
  const extraUsagePercentage = tokenUsage.extra_tokens > 0 ? 
    (tokenUsage.extra_tokens / (tokenUsage.extra_tokens + 1000)) * 100 : 0;

  return (
    <div className="min-h-screen">
      <Sidebar />
      
      <main className="pl-20 lg:pl-64 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="heading text-3xl md:text-4xl mb-8 text-text-primary">Settings</h1>

            <div className="space-y-8">
              {/* Appearance Settings */}
              <div className="glass rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Palette className="h-6 w-6 text-primary-500" />
                  <h2 className="text-xl font-display font-bold text-text-primary">Appearance</h2>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 text-text-primary">Theme</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'border-primary-500 bg-primary-500/10 scale-105' 
                          : 'border-border-color hover:border-primary-400/30 hover:scale-102'
                      }`}
                    >
                      <Moon className="h-5 w-5 text-text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-text-primary">Dark</p>
                        <p className="text-sm text-text-secondary">Dark theme with neon accents</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-300 ${
                        theme === 'light' 
                          ? 'border-primary-500 bg-primary-500/10 scale-105' 
                          : 'border-border-color hover:border-primary-400/30 hover:scale-102'
                      }`}
                    >
                      <Sun className="h-5 w-5 text-text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-text-primary">Light</p>
                        <p className="text-sm text-text-secondary">Light theme with soft pastels</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Token Usage */}
              <div className="glass rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-primary-500" />
                    <h2 className="text-xl font-display font-bold text-text-primary">Token Consumption</h2>
                  </div>
                  <button className="btn btn-secondary">
                    Add tokens
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-error-500/20 flex items-center justify-center">
                        <span className="text-error-500 font-bold">P</span>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Pro plan</p>
                        <p className="text-sm text-text-secondary">
                          {currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0]}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-success-400">Extra tokens left</span>
                          <span className="text-sm text-text-secondary">ℹ️</span>
                        </div>
                        <p className="text-2xl font-bold text-success-400">
                          {tokenUsage.extra_tokens.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-primary-400">Monthly tokens left</span>
                        </div>
                        <p className="text-2xl font-bold text-primary-400">
                          {(monthlyLimit - tokenUsage.monthly_tokens).toLocaleString()}
                          <span className="text-sm text-text-secondary ml-1">
                            / {monthlyLimit.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-success-400">Extra tokens</span>
                          <span className="text-text-secondary">{tokenUsage.extra_tokens.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div 
                            className="bg-success-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(extraUsagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-primary-400">Monthly tokens</span>
                          <span className="text-text-secondary">
                            {tokenUsage.monthly_tokens.toLocaleString()} / {monthlyLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(monthlyUsagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button className="btn btn-secondary flex items-center gap-2">
                        🔄 Reload tokens
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;