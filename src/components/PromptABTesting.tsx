import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, TrendingUp, BarChart3, Target, Zap, Copy, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, Mic, MicOff, Users, Lock } from 'lucide-react';
import { generatePrompt } from '../services/llm';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Enhanced type declarations
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof webkitSpeechRecognition;
  }
}

// Add proper type definitions for Speech Recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  
  start(): void;
  stop(): void;
  abort(): void;
  
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface ABTestResult {
  id: string;
  promptA: string;
  promptB: string;
  responseA: string;
  responseB: string;
  metrics: {
    clarity: number;
    effectiveness: number;
    engagement: number;
    overall: number;
  };
  winner: 'A' | 'B' | 'tie';
  timestamp: string;
}

const PromptABTesting: React.FC = () => {
  const { currentUser } = useAuth();
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ABTestResult | null>(null);
  const [testHistory, setTestHistory] = useState<ABTestResult[]>([]);
  const [selectedModel, setSelectedModel] = useState('GPT-4');
  const [copyStates, setCopyStates] = useState<{ [key: string]: boolean }>({});
  const [feedbackStates, setFeedbackStates] = useState<{ [key: string]: 'like' | 'dislike' | null }>({});
  const [savedStates, setSavedStates] = useState<{ [key: string]: boolean }>({});
  const [usageCount, setUsageCount] = useState(0);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const models = [
    'GPT-4', 'Claude 3', 'DeepSeek', 'Gemini', 'Grok', 'Perplexity', 
    'Mistral', 'Llama 2', 'PaLM 2', 'Cohere Command'
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognitionConstructor();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setOriginalPrompt(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Rest of your component code remains the same...
  // Load usage count from localStorage
  useEffect(() => {
    if (!currentUser) {
      const stored = localStorage.getItem('ab_test_usage_count');
      setUsageCount(stored ? parseInt(stored) : 0);
    }
  }, [currentUser]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const checkUsageLimit = () => {
    if (currentUser) return true;
    
    if (usageCount >= 1) {
      setShowSignUpModal(true);
      return false;
    }
    
    return true;
  };

  const incrementUsage = () => {
    if (!currentUser) {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('ab_test_usage_count', newCount.toString());
    }
  };

  const generateVariations = async () => {
    if (!originalPrompt) return;
    
    if (!checkUsageLimit()) return;
    
    setIsRunning(true);
    try {
      // Generate two different optimized versions using different methods
      const methods = ['role-based', 'chain-of-thought', 'constraint-based'];
      const methodA = methods[Math.floor(Math.random() * methods.length)];
      let methodB = methods[Math.floor(Math.random() * methods.length)];
      
      // Ensure different methods
      while (methodB === methodA) {
        methodB = methods[Math.floor(Math.random() * methods.length)];
      }
      
      const [variationA, variationB] = await Promise.all([
        generatePrompt(originalPrompt, methodA, { temperature: 0.7 }),
        generatePrompt(originalPrompt, methodB, { temperature: 0.7 })
      ]);
      
      setPromptA(variationA);
      setPromptB(variationB);
      incrementUsage();
    } catch (error) {
      console.error('Error generating variations:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runABTest = async () => {
    if (!promptA || !promptB) return;
    
    setIsRunning(true);
    try {
      // Simulate running both prompts and getting responses
      const [responseA, responseB] = await Promise.all([
        generatePrompt(`Test this prompt: ${promptA}`, 'general', { temperature: 0.5 }),
        generatePrompt(`Test this prompt: ${promptB}`, 'general', { temperature: 0.5 })
      ]);
      
      // Simulate metrics calculation
      const metricsA = {
        clarity: Math.random() * 40 + 60, // 60-100
        effectiveness: Math.random() * 40 + 60,
        engagement: Math.random() * 40 + 60,
        overall: 0
      };
      metricsA.overall = (metricsA.clarity + metricsA.effectiveness + metricsA.engagement) / 3;
      
      const metricsB = {
        clarity: Math.random() * 40 + 60,
        effectiveness: Math.random() * 40 + 60,
        engagement: Math.random() * 40 + 60,
        overall: 0
      };
      metricsB.overall = (metricsB.clarity + metricsB.effectiveness + metricsB.engagement) / 3;
      
      const winner = metricsA.overall > metricsB.overall ? 'A' : 
                    metricsB.overall > metricsA.overall ? 'B' : 'tie';
      
      const result: ABTestResult = {
        id: Date.now().toString(),
        promptA,
        promptB,
        responseA,
        responseB,
        metrics: winner === 'A' ? metricsA : metricsB,
        winner,
        timestamp: new Date().toISOString()
      };
      
      setResults(result);
      setTestHistory(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 tests
      // ADD THIS LINE:
await saveAbTestResult({
  originalPrompt,
  optimizedPrompt: result.winner === 'A' ? promptA : promptB,
  promptA,
  promptB,
  winnerPrompt: result.winner === 'A' ? promptA : promptB,
  modelUsed: selectedModel,
  metrics: result.metrics
});
    } catch (error) {
      console.error('Error running A/B test:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const resetTest = () => {
    setPromptA('');
    setPromptB('');
    setResults(null);
  };

  // Add this function inside your PromptABTesting component, after the other functions
const saveAbTestResult = async (testData) => {
  if (!currentUser) return; // Skip for anonymous users
  
  try {
    const { data, error } = await supabase
      .from('ab_test_results')
      .insert({
        user_id: currentUser.id,
        original_prompt: testData.originalPrompt,
        optimized_prompt: testData.optimizedPrompt,
        prompt_a: testData.promptA,
        prompt_b: testData.promptB,
        winner_prompt: testData.winnerPrompt,
        model_used: testData.modelUsed,
        prompt_type: 'A/B Test',
        source_page: 'ab-testing',
        metrics: testData.metrics
      });
      
    if (error) console.error('Error saving AB test:', error);
    return data;
  } catch (err) {
    console.error('Failed to save AB test result:', err);
  }
};

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFeedback = async (type: 'like' | 'dislike', id: string, prompt: string) => {
    setFeedbackStates(prev => ({ ...prev, [id]: type }));
    
    if (currentUser) {
      try {
        await supabase.from('prompt_feedback').insert({
          user_id: currentUser.id,
          prompt: prompt,
          feedback_type: type,
          original_prompt: originalPrompt,
          prompt_type: 'ab-test',
          model_used: selectedModel
        });
      } catch (err) {
        console.error('Failed to save feedback:', err);
      }
    }
  };

  const handleSave = async (prompt: string, id: string) => {
    if (!currentUser) return;
    
    try {
      await supabase.from('saved_prompts').insert({
        user_id: currentUser.id,
        original_prompt: originalPrompt,
        optimized_prompt: prompt,
        prompt_type: 'ab-test',
        model_used: selectedModel,
        title: `A/B Test Result - ${originalPrompt.substring(0, 30)}...`
      });
      
      setSavedStates(prev => ({ ...prev, [id]: true }));
    } catch (err) {
      console.error('Failed to save prompt:', err);
    }
  };

  return (
    <div className="space-y-8 pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="heading text-3xl md:text-4xl mb-4 text-text-primary">
          Prompt <span className="gradient-text">A/B Testing</span>
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Compare two prompt variations to see which performs better with real AI responses
        </p>
      </div>

      {/* Setup Section */}
      <div className="glass rounded-xl p-6 max-w-3xl mx-auto">
        <h3 className="text-xl font-display font-bold text-text-primary mb-4">Test Setup</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Original Prompt
            </label>
            <div className="relative">
              <textarea
                value={originalPrompt}
                onChange={(e) => setOriginalPrompt(e.target.value)}
                placeholder="Enter your base prompt to generate variations from..."
                className="input-field min-h-[100px] pr-12 w-full"
              />
              {recognition && (
                <button
                  onClick={toggleListening}
                  className={cn(
                    "absolute right-3 top-3 p-2 rounded-lg transition-colors",
                    isListening 
                      ? "bg-red-500/20 text-red-400 animate-pulse" 
                      : "hover:bg-white/10 text-text-secondary"
                  )}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Test Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="input-field w-full"
              >
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={generateVariations}
                disabled={!originalPrompt || isRunning}
                className="btn btn-primary flex items-center gap-2 flex-1 sm:flex-none"
              >
                <Zap className="h-4 w-4" />
                Generate Variations
              </button>
              
              <button
                onClick={resetTest}
                className="btn btn-secondary flex items-center gap-2 flex-1 sm:flex-none"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
          
          {!currentUser && (
            <div className="text-center pt-2">
              <p className="text-xs text-text-secondary">
                {usageCount >= 1 ? (
                  <span className="text-yellow-500">Daily limit reached - Sign up for unlimited access</span>
                ) : (
                  <span>Free: {1 - usageCount} test remaining today</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Variations Section */}
      {(promptA || promptB) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-display font-bold text-text-primary">Variation A</h4>
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                Method 1
              </span>
            </div>
            <textarea
              value={promptA}
              onChange={(e) => setPromptA(e.target.value)}
              className="input-field min-h-[120px] mb-4 w-full"
              placeholder="Variation A will appear here..."
            />
          </div>
          
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-display font-bold text-text-primary">Variation B</h4>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                Method 2
              </span>
            </div>
            <textarea
              value={promptB}
              onChange={(e) => setPromptB(e.target.value)}
              className="input-field min-h-[120px] mb-4 w-full"
              placeholder="Variation B will appear here..."
            />
          </div>
        </div>
      )}

      {/* Run Test Button */}
      {promptA && promptB && (
        <div className="text-center">
          <button
            onClick={runABTest}
            disabled={isRunning}
            className={cn(
              "btn btn-primary flex items-center gap-2 mx-auto",
              isRunning && "opacity-70 cursor-not-allowed"
            )}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Run A/B Test
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Section */}
      {results && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Winner Announcement */}
          <div className="glass rounded-xl p-6 text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Target className="h-6 w-6 text-primary-500" />
              <h3 className="text-xl font-display font-bold text-text-primary">Test Results</h3>
            </div>
            
            <div className="text-3xl font-bold mb-2">
              {results.winner === 'tie' ? (
                <span className="text-yellow-500">It's a Tie!</span>
              ) : (
                <span className="text-primary-500">Variation {results.winner} Wins!</span>
              )}
            </div>
            
            <p className="text-text-secondary">
              Overall Score: {results.metrics.overall.toFixed(1)}/100
            </p>
          </div>

          {/* Detailed Metrics */}
          <div className="glass rounded-xl p-6 max-w-4xl mx-auto">
            <h4 className="text-lg font-display font-bold text-text-primary mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">Clarity</span>
                  <span className="text-sm font-medium">{results.metrics.clarity.toFixed(1)}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${results.metrics.clarity}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">Effectiveness</span>
                  <span className="text-sm font-medium">{results.metrics.effectiveness.toFixed(1)}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${results.metrics.effectiveness}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">Engagement</span>
                  <span className="text-sm font-medium">{results.metrics.engagement.toFixed(1)}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${results.metrics.engagement}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Response Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-display font-bold text-text-primary">
                  Response A {results.winner === 'A' && '🏆'}
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(results.responseA, 'responseA')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      copyStates['responseA'] 
                        ? "bg-success-500/20 text-success-500" 
                        : "hover:bg-white/5"
                    )}
                    title="Copy Response"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback('like', 'responseA', results.responseA)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      feedbackStates['responseA'] === 'like' 
                        ? "bg-success-500/20 text-success-500" 
                        : "hover:bg-white/5"
                    )}
                    title="Like"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback('dislike', 'responseA', results.responseA)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      feedbackStates['responseA'] === 'dislike' 
                        ? "bg-error-500/20 text-error-500" 
                        : "hover:bg-white/5"
                    )}
                    title="Dislike"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                  {currentUser && (
                    <button
                      onClick={() => handleSave(results.responseA, 'responseA')}
                      disabled={savedStates['responseA']}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        savedStates['responseA'] 
                          ? "bg-success-500/20 text-success-500 cursor-not-allowed" 
                          : "hover:bg-white/5"
                      )}
                      title="Save"
                    >
                      {savedStates['responseA'] ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-text-secondary text-sm whitespace-pre-line">
                {results.responseA}
              </p>
            </div>
            
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-display font-bold text-text-primary">
                  Response B {results.winner === 'B' && '🏆'}
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(results.responseB, 'responseB')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      copyStates['responseB'] 
                        ? "bg-success-500/20 text-success-500" 
                        : "hover:bg-white/5"
                    )}
                    title="Copy Response"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback('like', 'responseB', results.responseB)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      feedbackStates['responseB'] === 'like' 
                        ? "bg-success-500/20 text-success-500" 
                        : "hover:bg-white/5"
                    )}
                    title="Like"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback('dislike', 'responseB', results.responseB)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      feedbackStates['responseB'] === 'dislike' 
                        ? "bg-error-500/20 text-error-500" 
                        : "hover:bg-white/5"
                    )}
                    title="Dislike"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                  {currentUser && (
                    <button
                      onClick={() => handleSave(results.responseB, 'responseB')}
                      disabled={savedStates['responseB']}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        savedStates['responseB'] 
                          ? "bg-success-500/20 text-success-500 cursor-not-allowed" 
                          : "hover:bg-white/5"
                      )}
                      title="Save"
                    >
                      {savedStates['responseB'] ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-text-secondary text-sm whitespace-pre-line">
                {results.responseB}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Test History */}
      {testHistory.length > 0 && (
        <div className="glass rounded-xl p-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-display font-bold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Tests
          </h3>
          
          <div className="space-y-3">
            {testHistory.map((test) => (
              <div key={test.id} className="glass p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary font-medium">
                      Winner: Variation {test.winner === 'tie' ? 'Tie' : test.winner}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Score: {test.metrics.overall.toFixed(1)}/100 • {new Date(test.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-secondary">
                      C: {test.metrics.clarity.toFixed(0)} | E: {test.metrics.effectiveness.toFixed(0)} | G: {test.metrics.engagement.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="glass rounded-xl p-6 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary-500/20 rounded-full">
                  <Lock className="h-8 w-8 text-primary-500" />
                </div>
              </div>
              <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                Unlock Unlimited Testing
              </h3>
              <p className="text-text-secondary mb-6">
                You've reached your daily limit of 1 free A/B test. Sign up to get unlimited access to all features.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignUpModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowSignUpModal(false);
                    // Add your signup navigation logic here
                    window.location.href = '/signup';
                  }}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Sign Up Free
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PromptABTesting;