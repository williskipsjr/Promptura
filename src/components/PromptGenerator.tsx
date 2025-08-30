import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, Copy, Sparkles, Loader, AlertCircle, ThumbsUp, ThumbsDown, 
  Bookmark, BookmarkCheck, Mic, MicOff, Zap, Brain, 
  RotateCcw, Share2, Download, Settings, Layers,
  ChevronDown, ChevronUp, Play, Pause, Volume2, VolumeX, Lightbulb, Target,
  MessageSquare, Image, Video
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generatePrompt, getAvailableTechniques, recommendTechnique, ADVANCED_TECHNIQUES, scorePromptQuality, autoRewritePrompt, estimateTokens } from '../services/llm';
import { supabase } from '../lib/supabase';
import AnimatedPlaceholder from './AnimatedPlaceholder';

interface PromptGeneratorProps {
  onGenerate?: (prompt: string) => void;
  onPromptChange?: (prompt: string) => void;
  limitToOnePrompt?: boolean;
  selectedModel?: string;
  id?: string;
  mode?: 'text' | 'image' | 'video';
}

const PromptGenerator: React.FC<PromptGeneratorProps> = ({ 
  onGenerate,
  onPromptChange,
  limitToOnePrompt = false,
  selectedModel,
  id = 'prompt-generator',
  mode = 'text'
}) => {
  const { currentUser } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [promptType, setPromptType] = useState<string | null>(null);
  const [showEnhanceOptions, setShowEnhanceOptions] = useState(false);
  const [showTechniques, setShowTechniques] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAlgorithmDropdown, setShowAlgorithmDropdown] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  
  // New state for advanced features
  const [isListening, setIsListening] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [tokenCount, setTokenCount] = useState({ original: 0, optimized: 0 });
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(800);
  const [tone, setTone] = useState('professional');
  const [style, setStyle] = useState('balanced');
  const [complexity, setComplexity] = useState<'simple' | 'intermediate' | 'advanced'>('intermediate');
  const [domain, setDomain] = useState('');
  const [showQualityScore, setShowQualityScore] = useState(false);
  const [qualityScore, setQualityScore] = useState<any>(null);
  const [recommendedTechnique, setRecommendedTechnique] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Add keyboard event handler for history navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Navigate through prompt history with up/down arrow keys
    if (e.key === 'ArrowUp' && promptHistory.length > 0 && currentHistoryIndex < promptHistory.length - 1) {
      e.preventDefault(); // Prevent cursor from moving to start of text
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      const historyPrompt = promptHistory[promptHistory.length - 1 - newIndex];
      setPrompt(historyPrompt);
      onPromptChange?.(historyPrompt);
    } else if (e.key === 'ArrowDown' && currentHistoryIndex > 0) {
      e.preventDefault(); // Prevent cursor from moving to end of text
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      const historyPrompt = promptHistory[promptHistory.length - 1 - newIndex];
      setPrompt(historyPrompt);
      onPromptChange?.(historyPrompt);
    } else if (e.key === 'ArrowDown' && currentHistoryIndex === 0) {
      e.preventDefault();
      setCurrentHistoryIndex(-1);
      setPrompt('');
      onPromptChange?.('');
    }
  };

  // Check if trial has been used
  useEffect(() => {
    const hasUsedTrial = localStorage.getItem('promptura_trial_used');
    setTrialUsed(hasUsedTrial === 'true');
  }, []);

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Updated Configuration - Key changes here
      recognitionRef.current.continuous = true; // Changed back to true
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;
      
      // Add these timeout settings to prevent premature stopping
      if (recognitionRef.current.serviceURI !== undefined) {
        recognitionRef.current.serviceURI = 'wss://www.google.com/speech-api/v2/recognize';
      }
      
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started - please speak now');
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        console.log('Speech recognition result received:', event);
        
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        console.log('Final transcript:', finalTranscript);
        console.log('Interim transcript:', interimTranscript);
        
        // Update with final transcript
        if (finalTranscript) {
          setPrompt(prevPrompt => {
            const newPrompt = prevPrompt ? prevPrompt + ' ' + finalTranscript : finalTranscript;
            const trimmedPrompt = newPrompt.trim();
            // Call onPromptChange with the new prompt value
            onPromptChange?.(trimmedPrompt);
            return trimmedPrompt;
          });
        }
        
        // Optionally show interim results in real-time
        if (interimTranscript && !finalTranscript) {
          // You can uncomment this to see interim results in the input
          // setPrompt(prevPrompt => {
          //   const basePrompt = prevPrompt.split(' ').slice(0, -1).join(' ');
          //   return basePrompt ? basePrompt + ' ' + interimTranscript : interimTranscript;
          // });
        }
      };
      
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle different error types
        switch (event.error) {
          case 'no-speech':
            console.log('No speech detected - you may need to speak louder or closer to the microphone');
            // Don't show alert for no-speech, just log it
            break;
          case 'not-allowed':
            alert('Microphone access denied. Please allow microphone access and try again.');
            break;
          case 'network':
            alert('Network error occurred during speech recognition.');
            break;
          case 'aborted':
            console.log('Speech recognition aborted');
            break;
          default:
            console.log('Speech recognition error:', event.error);
        }
        
        setIsListening(false);
      };
      
      recognitionRef.current.onnomatch = () => {
        console.log('No speech match found - try speaking more clearly');
        // Don't stop listening on no match, let it continue
      };
      
      recognitionRef.current.onspeechstart = () => {
        console.log('Speech detected - keep talking');
      };
      
      recognitionRef.current.onspeechend = () => {
        console.log('Speech ended - processing...');
      };
      
    } else {
      console.log('Speech recognition not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Voice input handler - SINGLE FUNCTION ONLY
  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (isListening) {
      console.log('Stopping speech recognition...');
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        console.log('Starting speech recognition... Please speak now.');
        recognitionRef.current.start();
        // setIsListening(true) is handled in onstart event
        
        // Optional: Auto-stop after 30 seconds to prevent hanging
        setTimeout(() => {
          if (isListening && recognitionRef.current) {
            console.log('Auto-stopping speech recognition after 30 seconds');
            recognitionRef.current.stop();
          }
        }, 30000);
        
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        
        // If there's an error starting, try again after a short delay
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }, 1000);
      }
    }
  };

  // Token counting simulation
  useEffect(() => {
    const originalTokens = Math.ceil(prompt.length / 4); // Rough estimation
    const optimizedTokens = generatedPrompt ? Math.ceil(generatedPrompt.length / 4) : 0;
    setTokenCount({ original: originalTokens, optimized: optimizedTokens });
  }, [prompt, generatedPrompt]);

  // Analyze prompt quality and recommend technique
  useEffect(() => {
    if (prompt.length > 20) {
      const score = scorePromptQuality(prompt);
      setQualityScore(score);
      
      const recommended = recommendTechnique(prompt);
      setRecommendedTechnique(recommended);
    } else {
      setQualityScore(null);
      setRecommendedTechnique(null);
    }
  }, [prompt]);

  const getPromptTypeLabel = (type: string | null) => {
    if (!type) return 'General';
    return ADVANCED_TECHNIQUES[type]?.name || type.replace('-', ' ');
  };

  const getPromptTypeDescription = (type: string | null) => {
    if (!type) return 'Basic prompt optimization';
    return ADVANCED_TECHNIQUES[type]?.description || 'Advanced prompt engineering technique';
  };

  const availableTechniques = getAvailableTechniques(complexity);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    // Check trial limitations
    if (limitToOnePrompt && !currentUser && trialUsed) {
      setShowSignupPrompt(true);
      return;
    }

    // Add to history
    if (prompt !== promptHistory[promptHistory.length - 1]) {
      setPromptHistory(prev => [...prev, prompt]);
      setCurrentHistoryIndex(promptHistory.length);
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedPrompt(null);
    setFeedback(null);
    setIsSaved(false);
    
    try {
      const config = {
        temperature,
        maxTokens,
        style: style as 'creative' | 'balanced' | 'precise',
        tone: tone as 'professional' | 'casual' | 'friendly',
        complexity,
        domain: domain || undefined
      };
      
      const result = await generatePrompt(prompt, promptType, config, selectedModel);
      setGeneratedPrompt(result);
      onGenerate?.(result);
      
      // Save to database if user is logged in
      if (currentUser) {
        await supabase.from('prompts').insert({
          user_id: currentUser.id,
          original_prompt: prompt,
          optimized_prompt: result,
          prompt_type: promptType,
          model_used: selectedModel || 'general',
        });
      } else {
        localStorage.setItem('promptura_trial_used', 'true');
        setTrialUsed(true);
      }
    } catch (err) {
      console.error('Error generating prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate prompt. Please try again later.');
      setGeneratedPrompt(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle algorithm selection
  const handleAlgorithmSelect = async (technique: string) => {
    if (!generatedPrompt) return;
    
    setShowAlgorithmDropdown(false);
    setSelectedTechnique(technique);
    setIsGenerating(true);
    setError(null);
    
    try {
      const config = {
        temperature,
        maxTokens,
        style: style as 'creative' | 'balanced' | 'precise',
        tone: tone as 'professional' | 'casual' | 'friendly',
        complexity,
        domain: domain || undefined
      };
      
      const result = await generatePrompt(generatedPrompt, technique, config, selectedModel);
      setGeneratedPrompt(result);
      onGenerate?.(result);
      
      // Update token count
      setTokenCount({
        original: tokenCount.original,
        optimized: Math.ceil(result.length / 4)
      });
      
      // Save to database if user is logged in
      if (currentUser) {
        await supabase.from('prompts').insert({
          user_id: currentUser.id,
          original_prompt: prompt,
          optimized_prompt: result,
          prompt_type: technique,
          model_used: selectedModel || 'general',
        });
      }
    } catch (err) {
      console.error('Error applying algorithm:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply algorithm. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSmartRewrite = async (type: 'creative' | 'compress' | 'formal' | 'casual') => {
    if (!generatedPrompt) return;
    
    setIsGenerating(true);
    try {
      let instruction = '';
      switch (type) {
        case 'creative':
          instruction = 'Make this prompt more creative and engaging';
          break;
        case 'compress':
          instruction = 'Compress this prompt to be more concise while maintaining effectiveness';
          break;
        case 'formal':
          instruction = 'Make this prompt more formal and professional';
          break;
        case 'casual':
          instruction = 'Make this prompt more casual and conversational';
          break;
      }
      
      const rewritten = await generatePrompt(`${instruction}: ${generatedPrompt}`, 'general', { temperature: 0.8 });
      setGeneratedPrompt(rewritten);
    } catch (err) {
      console.error('Error rewriting prompt:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedPrompt) return;
    
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Open provider URL with the generated prompt
  const handleOpenProvider = (provider: string) => {
    if (!generatedPrompt) return;
    
    const encodedPrompt = encodeURIComponent(generatedPrompt);
    let url = '';
    
    // Text generation providers
    if (provider === 'openai') {
      url = `https://chat.openai.com/?prompt=${encodedPrompt}`;
    } else if (provider === 'anthropic') {
      url = `https://claude.ai/chat?prompt=${encodedPrompt}`;
    } else if (provider === 'gemini') {
      url = `https://gemini.google.com/app?prompt=${encodedPrompt}`;
    }
    
    // Image generation providers
    else if (provider === 'midjourney') {
      url = `https://www.midjourney.com/app/imagine/describe/?prompt=${encodedPrompt}`;
    } else if (provider === 'dalle') {
      url = `https://labs.openai.com/?prompt=${encodedPrompt}`;
    } else if (provider === 'stability') {
      url = `https://stability.ai/stable-diffusion?prompt=${encodedPrompt}`;
    }
    
    // Video generation providers
    else if (provider === 'runway') {
      url = `https://runwayml.com/generate?prompt=${encodedPrompt}`;
    } else if (provider === 'pika') {
      url = `https://pika.art/create?prompt=${encodedPrompt}`;
    } else if (provider === 'gen2') {
      url = `https://research.runwayml.com/gen2?prompt=${encodedPrompt}`;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleShare = async () => {
    if (!generatedPrompt) return;
    
    const shareData = {
      title: 'Optimized Prompt from Promptura',
      text: generatedPrompt,
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to copying link
      await navigator.clipboard.writeText(`${generatedPrompt}\n\nGenerated with Promptura: ${window.location.href}`);
    }
  };

  const handleExport = () => {
    if (!generatedPrompt) return;
    
    const blob = new Blob([generatedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptura-optimized-prompt.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFeedback = async (type: 'like' | 'dislike') => {
    setFeedback(type);
    
    if (currentUser && generatedPrompt) {
      try {
        await supabase.from('prompt_feedback').insert({
          user_id: currentUser.id,
          prompt: generatedPrompt,
          feedback_type: type,
          original_prompt: prompt,
          prompt_type: promptType,
          model_used: selectedModel || 'general'
        });
      } catch (err) {
        console.error('Failed to save feedback:', err);
      }
    }
  };

  const handleSave = async () => {
    if (!currentUser || !generatedPrompt) return;
    
    try {
      await supabase.from('saved_prompts').insert({
        user_id: currentUser.id,
        original_prompt: prompt,
        optimized_prompt: generatedPrompt,
        prompt_type: promptType,
        model_used: selectedModel || 'general',
        title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '')
      });
      
      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save prompt:', err);
    }
  };

  const canGenerate = prompt && (!limitToOnePrompt || currentUser || !trialUsed);

  return (
    <div id={id} className="glass rounded-xl p-6 relative">
      {selectedModel && (
        <motion.div
          className="mb-4 glass p-3 rounded-lg border border-primary-500/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-primary-400">
            <Sparkles className="h-4 w-4 inline mr-2" />
            Enhancement tailored for <span className="font-semibold">{selectedModel}</span>
            {mode !== 'text' && (
              <span className="ml-2">
                ({mode === 'image' ? <Image className="h-4 w-4 inline mx-1" /> : <Video className="h-4 w-4 inline mx-1" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)} mode)
              </span>
            )}
          </p>
        </motion.div>
      )}

      {/* Trial indicator for non-logged-in users */}
      {!currentUser && !trialUsed && (
        <motion.div
          className="mb-4 glass p-3 rounded-lg border border-accent-500/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-accent-400">
            <Sparkles className="h-4 w-4 inline mr-2" />
            1 free prompt optimization available. <Link to="/signup" className="text-primary-400 hover:text-primary-300 underline">Sign up</Link> for unlimited access.
          </p>
        </motion.div>
      )}

      {/* Recommended Technique */}
      {recommendedTechnique && !promptType && (
        <motion.div
          className="mb-4 glass p-3 rounded-lg border border-yellow-500/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-400">
                Recommended: <span className="font-semibold">{ADVANCED_TECHNIQUES[recommendedTechnique]?.name}</span>
              </span>
            </div>
            <button
              onClick={() => setPromptType(recommendedTechnique)}
              className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full hover:bg-yellow-500/30 transition-colors"
            >
              Apply
            </button>
          </div>
          <p className="text-xs text-yellow-300 mt-1">
            {ADVANCED_TECHNIQUES[recommendedTechnique]?.description}
          </p>
        </motion.div>
      )}

      {/* Quality Score */}
      {qualityScore && showQualityScore && (
        <motion.div
          className="mb-4 glass p-3 rounded-lg border border-blue-500/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-400 font-medium">Prompt Quality Score</span>
            <span className="text-lg font-bold text-blue-400">{qualityScore.score.toFixed(0)}/100</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(qualityScore.factors).map(([factor, data]: [string, any]) => (
              <div key={factor} className="flex justify-between">
                <span className="text-neutral-400 capitalize">{factor}:</span>
                <span className={cn(
                  "font-medium",
                  data.score >= 80 ? "text-success-500" : 
                  data.score >= 60 ? "text-yellow-500" : "text-error-500"
                )}>
                  {data.score.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Input Area */}
      <div className="relative mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-text-secondary">Tokens: {tokenCount.original}</span>
          {tokenCount.original > 4000 && (
            <span className="text-xs px-2 py-1 bg-warning-500/20 text-warning-500 rounded-full">
              High token count
            </span>
          )}
          {qualityScore && (
            <button
              onClick={() => setShowQualityScore(!showQualityScore)}
              className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30 transition-colors"
            >
              Quality: {qualityScore.score.toFixed(0)}/100
            </button>
          )}
        </div>
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              const newValue = e.target.value;
              setPrompt(newValue);
              onPromptChange?.(newValue);
            }}
            onKeyDown={handleKeyDown}
            placeholder=""
            className="input-field min-h-[120px] pr-4"
          />
          
          {!prompt && (
            <div className="absolute top-3 left-4 text-neutral-400 pointer-events-none">
              <AnimatedPlaceholder />
            </div>
          )}
        </div>
        
        {/* Input Controls - Horizontally Aligned */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleVoiceInput}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              isListening 
                ? "bg-error-500 text-white animate-pulse" 
                : "bg-primary-500 hover:bg-primary-600 text-white"
            )}
            title={isListening ? "Stop recording" : "Voice input"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? 'Stop' : 'Mic'}
          </button>
          
          <button
            onClick={() => setShowEnhanceOptions(!showEnhanceOptions)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-pink-500 hover:bg-pink-600 transition-colors text-white"
            title="Enhance prompt"
          >
            <Sparkles className="h-4 w-4" />
            Enhance
          </button>
          
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-background-dark hover:bg-background-light transition-colors text-white"
            title="Advanced settings"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvancedSettings && (
          <motion.div
            className="mb-6 glass p-4 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h4 className="text-sm font-medium text-text-primary mb-3">Advanced Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Temperature: {temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Complexity</label>
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value as any)}
                  className="input-field text-sm"
                >
                  <option value="simple">Simple</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="creative">Creative</option>
                  <option value="balanced">Balanced</option>
                  <option value="precise">Precise</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs text-text-secondary mb-1">Domain Focus (Optional)</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., marketing, coding, education"
                className="input-field text-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Enhanced Options */}
      <AnimatePresence>
        {showEnhanceOptions && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="mb-3">
              <h4 className="text-sm font-medium text-text-primary mb-2">Advanced Prompt Engineering Techniques</h4>
              <p className="text-xs text-text-secondary">Choose a technique based on your task complexity and requirements</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(availableTechniques).map(([key, technique]) => (
                <button
                  key={key}
                  onClick={() => {
                    setPromptType(key);
                    setShowEnhanceOptions(false);
                  }}
                  className={cn(
                    "p-3 rounded-lg text-left transition-all duration-300 border",
                    promptType === key 
                      ? "bg-primary-500/20 text-primary-400 border-primary-500/30 scale-105" 
                      : "bg-background-dark hover:bg-white/5 text-neutral-300 border-white/10 hover:scale-102"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{technique.name}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      technique.complexity === 'simple' ? "bg-green-500/20 text-green-400" :
                      technique.complexity === 'intermediate' ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      {technique.complexity}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">{technique.description}</p>
                </button>
              ))}
              
              <button
                onClick={() => {
                  setPromptType(null);
                  setShowEnhanceOptions(false);
                }}
                className={cn(
                  "p-3 rounded-lg text-left transition-all duration-300 border",
                  promptType === null 
                    ? "bg-primary-500/20 text-primary-400 border-primary-500/30 scale-105" 
                    : "bg-background-dark hover:bg-white/5 text-neutral-300 border-white/10 hover:scale-102"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">General</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-neutral-500/20 text-neutral-400">
                    basic
                  </span>
                </div>
                <p className="text-xs text-neutral-400">Basic prompt optimization without advanced techniques</p>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {promptType && (
        <motion.div
          className="mb-4 glass p-3 rounded-lg border border-primary-500/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-400 font-medium">
                <Target className="h-4 w-4 inline mr-2" />
                {getPromptTypeLabel(promptType)}
              </p>
              <p className="text-xs text-primary-300 mt-1">
                {getPromptTypeDescription(promptType)}
              </p>
            </div>
            <button
              onClick={() => setPromptType(null)}
              className="text-xs px-2 py-1 bg-neutral-500/20 text-neutral-400 rounded-full hover:bg-neutral-500/30 transition-colors"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          className="mb-6 glass p-4 rounded-lg border border-error-500/30 flex items-center gap-3 text-error-500"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {limitToOnePrompt && !currentUser && trialUsed && (
        <motion.div
          className="mb-6 glass p-4 rounded-lg border border-warning-500/30 flex items-center gap-3 text-warning-500"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">You've used your free trial. Sign up to continue generating prompts!</p>
        </motion.div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        className={cn(
          "btn btn-primary w-full flex items-center justify-center gap-2 mb-6",
          (!canGenerate || isGenerating) && "opacity-70 cursor-not-allowed"
        )}
        disabled={!canGenerate || isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            Optimizing your prompt...
          </>
        ) : (
          <>
            <Wand2 className="h-5 w-5" />
            Generate Optimized Prompt
          </>
        )}
      </button>

      {/* Results Section */}
      {generatedPrompt && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* View Mode Controls */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setShowBeforeAfter(!showBeforeAfter)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                showBeforeAfter 
                  ? "bg-primary-500/20 text-primary-400" 
                  : "bg-background-dark hover:bg-background-light text-neutral-300"
              )}
            >
              <Layers className="h-4 w-4" />
              Before/After
            </button>
            
            {/* Algorithm Button for selecting techniques */}
            <div className="relative">
              <button
                onClick={() => setShowAlgorithmDropdown(!showAlgorithmDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors"
              >
                <Wand2 className="h-4 w-4" />
                Algorithm
                {showAlgorithmDropdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {/* Algorithm Dropdown */}
              <AnimatePresence>
                {showAlgorithmDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-background-dark border border-border rounded-lg shadow-lg z-10 overflow-hidden"
                  >
                    <div className="p-2 max-h-80 overflow-y-auto">
                      {Object.entries(getAvailableTechniques(complexity)).map(([key, technique]) => (
                        <button
                          key={key}
                          onClick={() => handleAlgorithmSelect(key)}
                          className="w-full text-left px-3 py-2 hover:bg-background-light rounded-md transition-colors flex flex-col gap-1"
                        >
                          <span className="font-medium text-sm text-primary-400">{technique.name}</span>
                          <span className="text-xs text-neutral-400">{technique.description}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Before/After Split View */}
          {showBeforeAfter ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-error-500 rounded-full"></span>
                  Original Prompt ({tokenCount.original} tokens)
                </h4>
                <p className="text-neutral-300 whitespace-pre-wrap text-sm">{prompt}</p>
              </div>
              
              <div className="glass p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-400 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                  Optimized Prompt ({tokenCount.optimized} tokens)
                </h4>
                <p className="text-white whitespace-pre-wrap text-sm">{generatedPrompt}</p>
              </div>
            </div>
          ) : (
            <div className="glass p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  Optimized Prompt
                  <span className="text-xs px-2 py-1 bg-success-500/20 text-success-500 rounded-full">
                    {tokenCount.optimized} tokens
                  </span>
                  {promptType && (
                    <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full">
                      {getPromptTypeLabel(promptType)}
                    </span>
                  )}
                  {mode !== 'text' && (
                    <span className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full">
                      {mode === 'image' ? <Image className="h-3 w-3 inline mr-1" /> : <Video className="h-3 w-3 inline mr-1" />}
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-white whitespace-pre-wrap mb-4">{generatedPrompt}</p>
            </div>
          )}

          {/* External Provider Buttons - Based on mode */}
          {mode !== 'text' && (
            <div className="flex flex-wrap gap-2 mb-4">
              <h4 className="w-full text-sm font-medium text-neutral-300 mb-2">Try with:</h4>
              {mode === 'image' && (
                <>
                  <button
                    onClick={() => window.open(`https://www.midjourney.com/app/imagine/describe/?prompt=${encodeURIComponent(generatedPrompt)}`, '_blank')}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <Image className="h-4 w-4" />
                    Midjourney
                  </button>
                  <button
                    onClick={() => window.open(`https://labs.openai.com/?prompt=${encodeURIComponent(generatedPrompt)}`, '_blank')}
                    className="px-3 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <Image className="h-4 w-4" />
                    DALL-E
                  </button>
                  <button
                    onClick={() => window.open(`https://stability.ai/stable-diffusion?prompt=${encodeURIComponent(generatedPrompt)}`, '_blank')}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <Image className="h-4 w-4" />
                    Stable Diffusion
                  </button>
                </>
              )}
              
              {mode === 'video' && (
                <>
                  <button
                    onClick={() => window.open(`https://runwayml.com/generate?prompt=${encodeURIComponent(generatedPrompt)}`, '_blank')}
                    className="px-3 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <Video className="h-4 w-4" />
                    Runway
                  </button>
                  <button
                    onClick={() => window.open(`https://pika.art/create?prompt=${encodeURIComponent(generatedPrompt)}`, '_blank')}
                    className="px-3 py-1.5 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <Video className="h-4 w-4" />
                    Pika
                  </button>
                </>
              )}
            </div>
          )}

          {/* Smart Rewrite Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleSmartRewrite('creative')}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors disabled:opacity-50"
            >
              <Brain className="h-4 w-4" />
              Make More Creative
            </button>
            
            <button
              onClick={() => handleSmartRewrite('compress')}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              Compress Prompt
            </button>
            
            <button
              onClick={() => handleSmartRewrite('formal')}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              Make Formal
            </button>
            
            <button
              onClick={() => handleSmartRewrite('casual')}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              Make Casual
            </button>
          </div>

          {/* Action buttons with enhanced micro-interactions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
                  copySuccess 
                    ? "bg-success-500/20 text-success-500 scale-105" 
                    : "bg-background-dark hover:bg-background-light text-neutral-300"
                )}
                title="Copy Prompt"
              >
                <Copy className="h-4 w-4" />
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-dark hover:bg-background-light text-neutral-300 transition-colors"
                title="Share Prompt"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-dark hover:bg-background-light text-neutral-300 transition-colors"
                title="Export Prompt"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              
              {currentUser && (
                <button
                  onClick={handleSave}
                  disabled={isSaved}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
                    isSaved 
                      ? "bg-success-500/20 text-success-500 cursor-not-allowed" 
                      : "bg-background-dark hover:bg-background-light text-neutral-300"
                  )}
                  title="Save Prompt"
                >
                  {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  {isSaved ? 'Saved!' : 'Save'}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFeedback('like')}
                className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  feedback === 'like' 
                    ? "bg-success-500/20 text-success-500 scale-110" 
                    : "bg-background-dark hover:bg-background-light text-neutral-400"
                )}
                title="Like"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFeedback('dislike')}
                className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  feedback === 'dislike' 
                    ? "bg-error-500/20 text-error-500 scale-110" 
                    : "bg-background-dark hover:bg-background-light text-neutral-400"
                )}
                title="Dislike"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {showSignupPrompt && (
        <motion.div
          className="mt-6 glass p-4 rounded-lg border border-primary-500/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-center text-sm mb-4">
            Sign up to generate unlimited optimized prompts and access all advanced features!
          </p>
          <div className="flex gap-2">
            <Link to="/signup" className="btn btn-primary flex-1">
              Sign Up Now
            </Link>
            <Link to="/login" className="btn btn-secondary flex-1">
              Login
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PromptGenerator;