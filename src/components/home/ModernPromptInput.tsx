import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Image, Video, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { generatePrompt } from '../../services/llm';
import { useAuth } from '../../contexts/AuthContext';

type ContentMode = 'text' | 'image' | 'video';

interface ModernPromptInputProps {
  onGenerate?: (prompt: string, mode: ContentMode) => void;
}

const ModernPromptInput: React.FC<ModernPromptInputProps> = ({ onGenerate }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ContentMode>('text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const modeConfig = {
    text: {
      icon: MessageSquare,
      label: 'Text',
      placeholder: 'Describe what you want to create with AI...',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    image: {
      icon: Image,
      label: 'Image',
      placeholder: 'Describe the image you want to generate...',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20'
    },
    video: {
      icon: Video,
      label: 'Video',
      placeholder: 'Describe the video you want to create...',
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20'
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const optimizedPrompt = await generatePrompt({
        originalPrompt: input,
        promptType: mode,
        model: 'claude-3-sonnet',
        temperature: 0.7,
        tone: 'professional',
        style: 'balanced',
        complexity: 'intermediate'
      });
      
      setGeneratedPrompt(optimizedPrompt);
      onGenerate?.(optimizedPrompt, mode);
    } catch (error) {
      console.error('Error generating prompt:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const currentMode = modeConfig[mode];
  const IconComponent = currentMode.icon;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center gap-2 mb-6"
      >
        {Object.entries(modeConfig).map(([key, config]) => {
          const ModeIcon = config.icon;
          const isActive = mode === key;
          
          return (
            <button
              key={key}
              onClick={() => setMode(key as ContentMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
                "border backdrop-blur-sm",
                isActive
                  ? `${config.bgColor} ${config.borderColor} ${config.color}`
                  : "bg-background-dark/30 border-border-primary/20 text-text-secondary hover:bg-background-dark/50"
              )}
            >
              <ModeIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{config.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Input Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        <form onSubmit={handleSubmit} className="relative">
          <div className={cn(
            "relative flex items-center",
            "glass rounded-2xl border backdrop-blur-sm",
            "transition-all duration-200",
            input.trim() ? currentMode.borderColor : "border-border-primary/20",
            "focus-within:ring-2 focus-within:ring-primary-500/20"
          )}>
            {/* Mode Icon */}
            <div className={cn(
              "flex items-center justify-center w-12 h-12 ml-3",
              currentMode.bgColor,
              "rounded-xl"
            )}>
              <IconComponent className={cn("h-5 w-5", currentMode.color)} />
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentMode.placeholder}
              className={cn(
                "flex-1 px-4 py-4 bg-transparent",
                "text-text-primary placeholder-text-secondary",
                "focus:outline-none text-lg"
              )}
              disabled={isGenerating}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className={cn(
                "flex items-center justify-center w-12 h-12 mr-3",
                "rounded-xl transition-all duration-200",
                input.trim() && !isGenerating
                  ? "bg-primary-500 hover:bg-primary-600 text-white"
                  : "bg-background-dark/50 text-text-secondary cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>

        {/* Generated Prompt Display */}
        {generatedPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 p-6 glass rounded-xl border border-border-primary/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary-500" />
              <span className="text-sm font-medium text-text-primary">Optimized Prompt</span>
            </div>
            <p className="text-text-primary leading-relaxed">{generatedPrompt}</p>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                className="text-sm text-primary-500 hover:text-primary-600 transition-colors"
              >
                Copy to clipboard
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Helper Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-center mt-4"
      >
        <p className="text-sm text-text-secondary">
          Press <kbd className="px-2 py-1 bg-background-dark/50 rounded text-xs">Enter</kbd> to generate or click the send button
        </p>
      </motion.div>
    </div>
  );
};

export default ModernPromptInput;