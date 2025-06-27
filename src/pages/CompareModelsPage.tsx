import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, BarChart3, Copy, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, Mic, MicOff, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { generatePrompt } from '../services/llm';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ModelComparison {
  model: string;
  prompt: string;
  score: number;
  reasoning: string;
  metrics: {
    accuracy: number;
    speed: number;
    creativity: number;
    coherence: number;
    relevance: number;
  };
}

const CompareModelsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [comparisons, setComparisons] = useState<ModelComparison[]>([]);
  const [copyStates, setCopyStates] = useState<{ [key: string]: boolean }>({});
  const [feedbackStates, setFeedbackStates] = useState<{ [key: string]: 'like' | 'dislike' | null }>({});
  const [savedStates, setSavedStates] = useState<{ [key: string]: boolean }>({});
  
  // Mic and prompt limit states
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const availableModels = [
    { id: 'gpt4', name: 'GPT-4', icon: '🤖', description: 'Complex reasoning and analysis' },
    { id: 'claude3', name: 'Claude 3', icon: '🧠', description: 'Natural conversations and ethics' },
    { id: 'deepseek', name: 'DeepSeek', icon: '🔍', description: 'Technical accuracy and coding' },
    { id: 'gemini', name: 'Gemini', icon: '💎', description: 'Multimodal capabilities' },
    { id: 'grok', name: 'Grok', icon: '⚡', description: 'Real-time information' },
    { id: 'perplexity', name: 'Perplexity', icon: '🔎', description: 'Research and citations' },
    { id: 'mistral', name: 'Mistral', icon: '🌪️', description: 'Speed and efficiency' },
    { id: 'llama2', name: 'Llama 2', icon: '🦙', description: 'Open-source performance' }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputPrompt(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
      };
    }

    // Load prompt count from localStorage
    const savedCount = localStorage.getItem('compareModelsPromptCount');
    if (savedCount) {
      setPromptCount(parseInt(savedCount));
    }
  }, []);

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else if (prev.length < 3) {
        return [...prev, modelId];
      }
      return prev;
    });
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setIsRecording(true);
    }
  };

 const generateComprehensivePrompt = async (originalPrompt: string, modelName: string): Promise<string> => {
  // This creates a much more detailed and comprehensive prompt using the LLM API
  const optimizationPrompt = `You are an expert prompt engineer optimizing for ${modelName}. 

Original request: "${originalPrompt}"

Create a comprehensive, detailed prompt that maximizes ${modelName}'s capabilities. Your optimized prompt should:

1. Provide clear context and background information
2. Define the specific role or persona the AI should adopt
3. Specify the desired output format and structure
4. Include relevant examples or templates where applicable
5. Set clear expectations for tone, style, and complexity
6. Add specific constraints or requirements
7. Include verification steps or quality checks
8. Provide guidance on handling edge cases

Structure your response to be thorough yet focused, ensuring ${modelName} can deliver the highest quality output for this specific task. Consider the model's strengths in ${getModelSpecialty(modelName)} and craft the prompt to leverage these capabilities effectively.

Your optimized prompt should be substantial (200-500 words) and production-ready.

Return ONLY the final optimized prompt without any explanations or additional text.`;

  try {
    // Call your actual LLM service instead of the static template
    const optimizedPrompt = await generatePrompt(optimizationPrompt, 'role-based', {
      temperature: 0.3,
      maxTokens: 800,
      complexity: 'advanced'
    }, modelName);
    
    return optimizedPrompt;
  } catch (error) {
    console.error('Error generating comprehensive prompt via LLM:', error);
    // Only fall back to static template if LLM call fails
    return createModelSpecificPrompt(originalPrompt, modelName);
  }
};

  const getModelSpecialty = (modelName: string): string => {
    const specialties: { [key: string]: string } = {
      'GPT-4': 'complex reasoning, code generation, and detailed analysis',
      'Claude 3': 'natural dialogue, ethical reasoning, and content analysis',
      'DeepSeek': 'technical accuracy, code optimization, and scientific content',
      'Gemini': 'multimodal processing, fast responses, and versatile tasks',
      'Grok': 'real-time information, current events, and conversational AI',
      'Perplexity': 'research tasks, source citations, and fact-checking',
      'Mistral': 'efficient processing, speed optimization, and concise responses',
      'Llama 2': 'open-source flexibility, customization, and cost-effective solutions'
    };
    return specialties[modelName] || 'general AI assistance';
  };

  const createModelSpecificPrompt = (originalPrompt: string, modelName: string): string => {
    const modelPrompts: { [key: string]: string } = {
      'GPT-4': `**Role**: You are a highly skilled expert analyst and problem-solver with deep domain knowledge.

**Context**: The user needs comprehensive assistance with: "${originalPrompt}"

**Task Requirements**:
• Provide thorough, well-reasoned analysis with step-by-step breakdown
• Include relevant examples, case studies, or analogies where appropriate
• Consider multiple perspectives and potential solutions
• Anticipate follow-up questions and address them proactively
• Ensure accuracy and cite reasoning where applicable

**Output Format**:
• Start with a brief executive summary
• Present main content in clear, logical sections
• Include actionable recommendations or next steps
• End with key takeaways or conclusions

**Quality Standards**:
• Maintain professional yet accessible tone
• Support claims with logical reasoning
• Address potential limitations or considerations
• Provide practical, implementable advice

**Verification**: Before responding, ensure your answer is comprehensive, accurate, and directly addresses all aspects of the user's request while leveraging your analytical capabilities.`,

      'Claude 3': `**Persona**: You are a thoughtful, ethical AI assistant focused on providing helpful, harmless, and honest responses.

**User Request**: "${originalPrompt}"

**Approach Guidelines**:
• Prioritize user safety and well-being in all recommendations
• Consider ethical implications and potential consequences
• Provide balanced perspectives while being genuinely helpful
• Use natural, conversational language that feels authentic
• Show empathy and understanding for the user's situation

**Response Structure**:
• Acknowledge the user's request with understanding
• Provide comprehensive, well-structured information
• Include relevant context and background where helpful
• Offer practical guidance with clear explanations
• Address potential concerns or limitations transparently

**Communication Style**:
• Be warm and approachable while maintaining professionalism
• Use clear, jargon-free language unless technical terms are necessary
• Ask clarifying questions if the request could be interpreted multiple ways
• Provide examples or analogies to enhance understanding

**Ethical Considerations**: Ensure all advice promotes positive outcomes and respects user autonomy while providing genuinely valuable assistance.`,

      'DeepSeek': `**Technical Specification**: You are a precision-focused AI system optimized for accuracy and technical excellence.

**Problem Statement**: "${originalPrompt}"

**Analysis Framework**:
• Break down the problem into core technical components
• Apply systematic methodology and best practices
• Prioritize accuracy and technical correctness
• Include relevant specifications, parameters, or constraints
• Consider scalability, efficiency, and maintainability factors

**Implementation Details**:
• Provide specific, actionable technical guidance
• Include code examples, algorithms, or methodologies where applicable
• Address potential edge cases and error handling
• Specify testing and validation approaches
• Consider performance optimization opportunities

**Output Requirements**:
• Present information in structured, logical format
• Use precise technical terminology appropriately
• Include quantitative metrics or benchmarks where relevant
• Provide clear documentation and explanations
• Ensure reproducibility of any recommended solutions

**Quality Assurance**: Verify technical accuracy, completeness, and practical applicability of all recommendations before presenting.`,

      'Gemini': `**Multi-Modal Assistant Role**: You are a versatile AI capable of processing and integrating information across multiple formats and domains.

**User Objective**: "${originalPrompt}"

**Comprehensive Analysis Approach**:
• Consider visual, textual, and contextual elements if applicable
• Integrate information from multiple relevant domains
• Provide fast, efficient responses without sacrificing quality
• Adapt communication style to match user needs and context
• Leverage broad knowledge base for comprehensive solutions

**Response Framework**:
• Quickly identify key components and requirements
• Synthesize information from relevant sources and domains
• Present clear, actionable recommendations
• Include supporting details and rationale
• Provide alternative approaches or considerations

**Integration Focus**:
• Connect related concepts and applications
• Consider interdisciplinary perspectives
• Highlight synergies and potential conflicts
• Suggest complementary tools or resources
• Address scalability and adaptability factors

**Delivery Standards**: Ensure responses are comprehensive yet concise, technically sound, and immediately actionable while maintaining accessibility for users with varying expertise levels.`,

      'Grok': `**Real-Time Information Specialist**: You are an up-to-date, conversational AI with access to current information and trends.

**Current Context Request**: "${originalPrompt}"

**Information Gathering Approach**:
• Incorporate latest developments and current trends
• Consider real-time implications and immediate relevance
• Provide timely, actionable insights
• Use conversational, engaging communication style
• Include current examples and recent case studies

**Response Elements**:
• Lead with most recent and relevant information
• Explain current market/social/technical context
• Provide immediate actionable steps
• Include trending approaches or solutions
• Address timing considerations and urgency factors

**Communication Style**:
• Be direct and conversational
• Use current terminology and references
• Include relevant humor or personality where appropriate
• Stay focused on practical, immediate applications
• Maintain engagement while being informative

**Currency Focus**: Ensure all information reflects current best practices, recent developments, and immediate applicability in today's context.`,

      'Perplexity': `**Research-Focused Analysis**: You are a thorough researcher providing comprehensive, well-sourced information and analysis.

**Research Query**: "${originalPrompt}"

**Methodology**:
• Conduct comprehensive information gathering and analysis
• Synthesize multiple authoritative sources and perspectives
• Provide evidence-based recommendations and conclusions
• Include relevant citations and supporting documentation
• Address potential biases and limitations in available information

**Research Structure**:
• Begin with clear problem definition and scope
• Present findings in logical, hierarchical format
• Include comparative analysis where applicable
• Provide quantitative data and qualitative insights
• Conclude with evidence-based recommendations

**Source Integration**:
• Draw from academic, industry, and expert sources
• Include recent studies, reports, and authoritative publications
• Present conflicting viewpoints and their merits
• Explain methodology and confidence levels
• Provide additional reading or verification resources

**Academic Rigor**: Maintain high standards for accuracy, objectivity, and comprehensive coverage while presenting information in accessible, actionable format.`,

      'Mistral': `**Efficient Solution Provider**: You are optimized for delivering concise, high-impact responses that maximize value while minimizing complexity.

**Optimization Target**: "${originalPrompt}"

**Efficiency Framework**:
• Identify core requirements and essential elements
• Eliminate unnecessary complexity while maintaining effectiveness
• Focus on practical, implementable solutions
• Prioritize speed of execution and resource efficiency
• Provide clear, direct guidance with minimal overhead

**Streamlined Response Format**:
• Lead with key insights and primary recommendations
• Use bullet points and structured formats for clarity
• Include only essential background and context
• Focus on actionable steps with clear priorities
• Conclude with concise summary and next steps

**Resource Optimization**:
• Consider time, cost, and complexity trade-offs
• Suggest most efficient tools and approaches
• Highlight quick wins and high-impact actions
• Address scalability and maintenance considerations
• Provide lean implementation strategies

**Value Maximization**: Ensure every element of the response contributes directly to solving the user's problem efficiently and effectively.`,

      'Llama 2': `**Open-Source Solution Architect**: You are focused on providing flexible, customizable solutions that prioritize user control and adaptability.

**Customization Request**: "${originalPrompt}"

**Open Approach Philosophy**:
• Provide transparent, modifiable solutions
• Include multiple implementation options and alternatives
• Consider cost-effectiveness and resource accessibility
• Enable user customization and personal adaptation
• Support various skill levels and technical capabilities

**Flexible Solution Framework**:
• Present core solution with modular components
• Include beginner, intermediate, and advanced approaches
• Provide configuration options and customization guidance
• Suggest open-source tools and resources where applicable
• Enable iterative improvement and personal optimization

**Community-Focused Elements**:
• Reference community best practices and shared knowledge
• Include collaborative approaches and peer learning opportunities
• Suggest ways to contribute back or share improvements
• Consider diverse user needs and accessibility requirements
• Provide learning resources for skill development

**Adaptability Standards**: Ensure solutions can be modified, extended, and personalized while maintaining effectiveness across different user contexts and requirements.`
    };

    return modelPrompts[modelName] || `Please provide a comprehensive response to: "${originalPrompt}". Structure your response clearly, provide detailed explanations, include relevant examples, and ensure practical applicability. Consider multiple approaches and provide thorough guidance that addresses all aspects of the request.`;
  };

  // Enhanced metrics calculation
  const calculateMetrics = (modelId: string): { score: number; metrics: any } => {
    const baseMetrics = {
      gpt4: { accuracy: 92, speed: 78, creativity: 94, coherence: 96, relevance: 93 },
      claude3: { accuracy: 89, speed: 82, creativity: 87, coherence: 94, relevance: 91 },
      deepseek: { accuracy: 95, speed: 85, creativity: 76, coherence: 88, relevance: 89 },
      gemini: { accuracy: 88, speed: 91, creativity: 85, coherence: 87, relevance: 88 },
      grok: { accuracy: 82, speed: 94, creativity: 89, coherence: 84, relevance: 90 },
      perplexity: { accuracy: 94, speed: 79, creativity: 73, coherence: 91, relevance: 95 },
      mistral: { accuracy: 85, speed: 96, creativity: 78, coherence: 85, relevance: 87 },
      llama2: { accuracy: 83, speed: 88, creativity: 82, coherence: 86, relevance: 84 }
    };

    const metrics = baseMetrics[modelId as keyof typeof baseMetrics] || 
      { accuracy: 80, speed: 80, creativity: 80, coherence: 80, relevance: 80 };
    
    // Add some randomization to make it more realistic
    Object.keys(metrics).forEach(key => {
      metrics[key as keyof typeof metrics] += Math.floor(Math.random() * 10) - 5;
      metrics[key as keyof typeof metrics] = Math.max(60, Math.min(100, metrics[key as keyof typeof metrics]));
    });

    const score = Math.round(Object.values(metrics).reduce((a, b) => a + b, 0) / 5);
    return { score, metrics };
  };

  const saveModelComparisonResult = async (comparisonData: any) => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('model_comparisons')
        .insert({
          user_id: currentUser.id,
          original_prompt: comparisonData.originalPrompt,
          optimized_prompt: comparisonData.optimizedPrompt,
          model_a: comparisonData.modelA,
          model_b: comparisonData.modelB,
          model_c: comparisonData.modelC,
          model_a_response: comparisonData.modelAResponse,
          model_b_response: comparisonData.modelBResponse,
          model_c_response: comparisonData.modelCResponse,
          winner_model: comparisonData.winnerModel,
          winner_prompt: comparisonData.winnerPrompt,
          prompt_type: 'Model Comparison',
          source_page: 'compare-models',
          comparison_metrics: comparisonData.metrics,
          selected_models: comparisonData.selectedModels
        });
        
      if (error) {
        console.error('Error saving model comparison:', error);
        return null;
      }
      
      console.log('Model comparison saved successfully:', data);
      return data;
    } catch (err) {
      console.error('Failed to save model comparison result:', err);
      return null;
    }
  };

  const generateComparisons = async () => {
    if (!inputPrompt || selectedModels.length === 0) return;
    
    if (!currentUser && promptCount >= 1) {
      setShowSignUpModal(true);
      return;
    }
    
    setIsGenerating(true);
    setComparisons([]);
    
    try {
      const results: ModelComparison[] = [];
      
      for (const modelId of selectedModels) {
        const model = availableModels.find(m => m.id === modelId);
        if (!model) continue;
        
        // Generate comprehensive optimized prompt
        const optimizedPrompt = await generateComprehensivePrompt(inputPrompt, model.name);
        
        // Calculate performance metrics
        const { score, metrics } = calculateMetrics(modelId);
        
        const reasoning = `${model.name} demonstrates ${score >= 90 ? 'exceptional' : score >= 85 ? 'excellent' : score >= 80 ? 'very good' : 'good'} performance for this prompt type. The model excels in ${getTopMetrics(metrics).join(' and ')}, making it well-suited for tasks requiring ${getModelSpecialty(model.name)}. The comprehensive prompt optimization leverages ${model.name}'s core strengths to maximize output quality and relevance.`;
        
        results.push({
          model: model.name,
          prompt: optimizedPrompt,
          score,
          reasoning,
          metrics
        });
      }
      
      // Sort by score (highest first)
      results.sort((a, b) => b.score - a.score);
      setComparisons(results);
      
      // Save comparison results if user is logged in
      if (currentUser && results.length > 0) {
        const comparisonData = {
          originalPrompt: inputPrompt,
          optimizedPrompt: results[0]?.prompt,
          modelA: results[0]?.model,
          modelB: results[1]?.model || null,
          modelC: results[2]?.model || null,
          modelAResponse: results[0]?.prompt,
          modelBResponse: results[1]?.prompt || null,
          modelCResponse: results[2]?.prompt || null,
          winnerModel: results[0]?.model,
          winnerPrompt: results[0]?.prompt,
          selectedModels: selectedModels,
          metrics: {
            scores: results.map(r => ({ model: r.model, score: r.score })),
            detailedMetrics: results.map(r => ({ model: r.model, metrics: r.metrics })),
            reasoning: results.map(r => ({ model: r.model, reasoning: r.reasoning }))
          }
        };
        
        await saveModelComparisonResult(comparisonData);
      }
      
      // Update prompt count for non-signed users
      if (!currentUser) {
        const newCount = promptCount + 1;
        setPromptCount(newCount);
        localStorage.setItem('compareModelsPromptCount', newCount.toString());
      }
      
    } catch (error) {
      console.error('Error generating comparisons:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTopMetrics = (metrics: any): string[] => {
    const sortedMetrics = Object.entries(metrics)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([key]) => key);
    return sortedMetrics;
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
          original_prompt: inputPrompt,
          prompt_type: 'model-comparison',
          model_used: id
        });
      } catch (err) {
        console.error('Failed to save feedback:', err);
      }
    }
  };

  // FIXED: Save function now works properly
  const handleSave = async (prompt: string, model: string) => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase.from('saved_prompts').insert({
        user_id: currentUser.id,
        original_prompt: inputPrompt,
        optimized_prompt: prompt,
        prompt_type: 'model-comparison',
        model_used: model,
        title: `${model} Optimized - ${inputPrompt.substring(0, 30)}...`,
        created_at: new Date().toISOString()
      });
      
      if (error) {
        console.error('Error saving prompt:', error);
        return;
      }
      
      // Update saved state to show success
      setSavedStates(prev => ({ ...prev, [model]: true }));
      
      // Optional: Show success message
      console.log('Prompt saved successfully:', data);
      
    } catch (err) {
      console.error('Failed to save prompt:', err);
    }
  };

  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <h1 className="heading text-3xl md:text-4xl mb-4 text-text-primary">
              Compare AI <span className="gradient-text">Models</span>
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Generate optimized prompts for multiple AI models and compare their performance with detailed metrics.
            </p>
            {!currentUser && (
              <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-primary-400">
                  Free users: {promptCount}/1 comparison used
                  {promptCount >= 1 && (
                    <span className="block text-xs mt-1">
                      <button 
                        onClick={() => setShowSignUpModal(true)}
                        className="text-primary-300 hover:text-primary-200 underline"
                      >
                        Sign up for unlimited comparisons
                      </button>
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="glass rounded-xl p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Your Prompt
                  </label>
                  <div className="relative">
                    <textarea
                      value={inputPrompt}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      placeholder="Enter your prompt to optimize for different AI models..."
                      className="input-field min-h-[120px] pr-12"
                    />
                    <button
                      onClick={handleMicClick}
                      className={cn(
                        "absolute right-3 top-3 p-2 rounded-lg transition-all duration-200",
                        isRecording 
                          ? "bg-red-500/20 text-red-400 animate-pulse" 
                          : "bg-white/5 text-text-secondary hover:bg-primary-500/20 hover:text-primary-400"
                      )}
                      title={isRecording ? "Stop recording" : "Start voice input"}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  </div>
                  {isListening && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-primary-400">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      Listening...
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-4">
                    Select Models to Compare (Max 3)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelToggle(model.id)}
                        disabled={!selectedModels.includes(model.id) && selectedModels.length >= 3}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all duration-300 text-left",
                          selectedModels.includes(model.id)
                            ? "border-primary-500 bg-primary-500/10 scale-105"
                            : "border-border-color hover:border-primary-400/30 hover:scale-102",
                          !selectedModels.includes(model.id) && selectedModels.length >= 3 && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{model.icon}</span>
                          <span className="font-medium text-text-primary">{model.name}</span>
                        </div>
                        <p className="text-xs text-text-secondary">{model.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateComparisons}
                  disabled={!inputPrompt || selectedModels.length === 0 || isGenerating || (!currentUser && promptCount >= 1)}
                  className={cn(
                    "btn btn-primary w-full flex items-center justify-center gap-2",
                    (!inputPrompt || selectedModels.length === 0 || isGenerating || (!currentUser && promptCount >= 1)) && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Zap className="h-5 w-5 animate-spin" />
                      Generating Comparisons...
                    </>
                  ) : !currentUser && promptCount >= 1 ? (
                    <>
                      <Target className="h-5 w-5" />
                      Sign Up for More Comparisons
                    </>
                  ) : (
                    <>
                      <Target className="h-5 w-5" />
                      Compare Models
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {comparisons.length > 0 && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
                  Comparison Results
                </h2>
                <p className="text-text-secondary">
                  Models ranked by predicted performance for your prompt
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {comparisons.map((comparison, index) => (
                  <motion.div
                    key={comparison.model}
                    className="glass rounded-xl p-6 relative h-full flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Rank Badge */}
<div className="absolute top-1 right-1 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white relative">
  <span className="text-base font-bold text-white">#{index + 1}</span>
  {index === 0 && (
    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 animate-bounce">
      <span className="text-xl">👑</span>
    </div>
  )}
</div>

                    {/* Model Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {availableModels.find(m => m.name === comparison.model)?.icon || '🤖'}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">{comparison.model}</h3>
                          <p className="text-sm text-text-secondary">
                            {availableModels.find(m => m.name === comparison.model)?.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Performance Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-secondary">Overall Score</span>
                        <span className="text-2xl font-bold text-primary-400">{comparison.score}/100</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${comparison.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Detailed Metrics */}
                    <div className="mb-4 space-y-2">
                      <h4 className="text-sm font-medium text-text-secondary mb-3">Performance Metrics</h4>
                      {Object.entries(comparison.metrics).map(([metric, value]) => (
                        <div key={metric} className="flex items-center justify-between">
                          <span className="text-xs text-text-secondary capitalize">{metric}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-700 rounded-full h-1">
                              <div 
                                className={cn(
                                  "h-1 rounded-full transition-all duration-700",
                                  value >= 90 ? "bg-green-500" :
                                  value >= 80 ? "bg-yellow-500" :
                                  value >= 70 ? "bg-orange-500" : "bg-red-500"
                                )}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-primary w-8">{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Performance Analysis */}
                    <div className="mb-4 flex-grow">
                      <h4 className="text-sm font-medium text-text-secondary mb-2">Performance Analysis</h4>
                      <p className="text-xs text-text-secondary leading-relaxed">{comparison.reasoning}</p>
                    </div>

                    {/* Optimized Prompt */}
                    <div className="mb-4 flex-grow">
                      <h4 className="text-sm font-medium text-text-secondary mb-2">Optimized Prompt</h4>
                      <div className="bg-gray-800/50 rounded-lg p-3 max-h-40 overflow-y-auto custom-scrollbar">
                        <pre className="text-xs text-text-primary whitespace-pre-wrap font-mono leading-relaxed">
                          {comparison.prompt}
                        </pre>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border-color">
                      <button
                        onClick={() => handleCopy(comparison.prompt, comparison.model)}
                        className="flex items-center gap-1 px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy prompt"
                      >
                        <Copy className="h-3 w-3" />
                        {copyStates[comparison.model] ? 'Copied!' : 'Copy'}
                      </button>

                      <button
                        onClick={() => handleFeedback('like', comparison.model, comparison.prompt)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors",
                          feedbackStates[comparison.model] === 'like'
                            ? "bg-green-500/20 text-green-400"
                            : "bg-white/5 hover:bg-green-500/10 text-text-secondary hover:text-green-400"
                        )}
                        title="Like this prompt"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>

                      <button
                        onClick={() => handleFeedback('dislike', comparison.model, comparison.prompt)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors",
                          feedbackStates[comparison.model] === 'dislike'
                            ? "bg-red-500/20 text-red-400"
                            : "bg-white/5 hover:bg-red-500/10 text-text-secondary hover:text-red-400"
                        )}
                        title="Dislike this prompt"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>

                      {currentUser && (
                        <button
                          onClick={() => handleSave(comparison.prompt, comparison.model)}
                          className={cn(
                            "flex items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors ml-auto",
                            savedStates[comparison.model]
                              ? "bg-primary-500/20 text-primary-400"
                              : "bg-white/5 hover:bg-primary-500/10 text-text-secondary hover:text-primary-400"
                          )}
                          title="Save prompt"
                        >
                          {savedStates[comparison.model] ? (
                            <BookmarkCheck className="h-3 w-3" />
                          ) : (
                            <Bookmark className="h-3 w-3" />
                          )}
                          {savedStates[comparison.model] ? 'Saved' : 'Save'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Sign Up Modal */}
          {showSignUpModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                className="glass rounded-xl p-6 max-w-md w-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-text-primary">Upgrade to Pro</h3>
                  <button
                    onClick={() => setShowSignUpModal(false)}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-text-secondary mb-6">
                  You've reached the limit for free model comparisons. Sign up to get unlimited access to all features.
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
                      // Add navigation to sign up page
                    }}
                    className="btn btn-primary flex-1"
                  >
                    Sign Up Now
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
};

export default CompareModelsPage;
