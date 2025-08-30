import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import ModernPromptInput from './ModernPromptInput';

const HeroSection: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);

  return (
    <section className="min-h-screen pt-32 pb-20 relative overflow-hidden">
      {/* Background blur effects */}
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background-dark/50">
              <Sparkles className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-medium text-text-primary">Master the Art of Prompting. Intelligently.</span>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 mt-6"
          >
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight text-text-primary">
              <div className="mb-4">Talk to any AI —</div>
              
              {/* Single line with all three words */}
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.3,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="text-pink-500 font-bold"
                >
                  better,
                </motion.span>
                
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.5,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="text-pink-500 font-bold"
                >
                  faster,
                </motion.span>
                
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.7,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="text-violet-400 font-bold"
                >
                  smarter
                </motion.span>
              </div>
            </h1>
          </motion.div>
          
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mb-12"
          >
            <p className="text-lg text-text-secondary max-w-3xl mx-auto font-display">
              Promptura knows how to talk to ChatGPT, Claude, DeepSeek, Mistral, and more — so you don't have to.
            </p>
          </motion.div>

          {/* Modern Prompt Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="max-w-4xl mx-auto"
          >
            <ModernPromptInput />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;