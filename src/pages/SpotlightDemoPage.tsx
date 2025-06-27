import React from 'react';
import { motion } from 'framer-motion';
import { GlowCard } from '../components/ui/spotlight-card';
import { Sparkles, Zap, Brain, Target, Star, Award } from 'lucide-react';

const SpotlightDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="heading text-3xl md:text-4xl mb-4 text-text-primary">
              Spotlight <span className="gradient-text">Card Demo</span>
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Interactive spotlight cards that follow your cursor with beautiful glow effects. Perfect for showcasing features, products, or any content that needs attention.
            </p>
          </div>

          {/* Basic Demo */}
          <div className="mb-16">
            <h2 className="text-2xl font-display font-bold text-text-primary mb-8 text-center">
              Basic Spotlight Cards
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-10 min-h-[400px]">
              <GlowCard glowColor="blue">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Blue Glow</h3>
                  <p className="text-gray-300 text-sm">Hover to see the magic</p>
                </div>
              </GlowCard>

              <GlowCard glowColor="purple">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Brain className="h-12 w-12 text-purple-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Purple Glow</h3>
                  <p className="text-gray-300 text-sm">Interactive spotlight</p>
                </div>
              </GlowCard>

              <GlowCard glowColor="green">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Target className="h-12 w-12 text-green-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Green Glow</h3>
                  <p className="text-gray-300 text-sm">Follows your cursor</p>
                </div>
              </GlowCard>
            </div>
          </div>

          {/* Different Sizes */}
          <div className="mb-16">
            <h2 className="text-2xl font-display font-bold text-text-primary mb-8 text-center">
              Different Sizes
            </h2>
            <div className="flex flex-wrap items-end justify-center gap-8 min-h-[500px]">
              <GlowCard size="sm" glowColor="orange">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Star className="h-8 w-8 text-orange-400 mb-2" />
                  <h3 className="text-lg font-bold text-white mb-1">Small</h3>
                  <p className="text-gray-300 text-xs">Compact size</p>
                </div>
              </GlowCard>

              <GlowCard size="md" glowColor="red">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Zap className="h-10 w-10 text-red-400 mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Medium</h3>
                  <p className="text-gray-300 text-sm">Default size</p>
                </div>
              </GlowCard>

              <GlowCard size="lg" glowColor="purple">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Award className="h-12 w-12 text-purple-400 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-3">Large</h3>
                  <p className="text-gray-300">Maximum impact</p>
                </div>
              </GlowCard>
            </div>
          </div>

          {/* Custom Content Cards */}
          <div className="mb-16">
            <h2 className="text-2xl font-display font-bold text-text-primary mb-8 text-center">
              Feature Showcase
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <GlowCard glowColor="blue" className="h-80">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="h-8 w-8 text-blue-400" />
                    <h3 className="text-xl font-bold text-white">AI Prompting</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-4 flex-1">
                    Generate optimized prompts for any AI model with advanced techniques and real-time optimization.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 text-sm font-medium">Learn More</span>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </GlowCard>

              <GlowCard glowColor="purple" className="h-80">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="h-8 w-8 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">A/B Testing</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-4 flex-1">
                    Compare different prompt variations and find the most effective approach for your use case.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 text-sm font-medium">Try Now</span>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </GlowCard>

              <GlowCard glowColor="green" className="h-80">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-8 w-8 text-green-400" />
                    <h3 className="text-xl font-bold text-white">Model Compare</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-4 flex-1">
                    Test your prompts across multiple AI models and see which performs best for your specific needs.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 text-sm font-medium">Compare</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="glass rounded-xl p-8 text-center">
            <h2 className="text-2xl font-display font-bold text-text-primary mb-4">
              How to Use
            </h2>
            <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
              Move your cursor around the page to see the spotlight effect in action. The glow follows your mouse movement and creates beautiful interactive borders around the cards.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="glass p-4 rounded-lg">
                <h3 className="font-bold text-text-primary mb-2">1. Import Component</h3>
                <code className="text-sm text-primary-400 bg-background-dark p-2 rounded block">
                  import {`{ GlowCard }`} from '@/components/ui/spotlight-card'
                </code>
              </div>
              <div className="glass p-4 rounded-lg">
                <h3 className="font-bold text-text-primary mb-2">2. Choose Glow Color</h3>
                <p className="text-sm text-text-secondary">
                  Select from blue, purple, green, red, or orange glow effects
                </p>
              </div>
              <div className="glass p-4 rounded-lg">
                <h3 className="font-bold text-text-primary mb-2">3. Add Content</h3>
                <p className="text-sm text-text-secondary">
                  Place any content inside the GlowCard component
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SpotlightDemoPage;