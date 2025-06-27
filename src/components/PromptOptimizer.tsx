import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Copy, ThumbsUp, ThumbsDown, Loader, AlertCircle } from 'lucide-react';
import { generatePrompt } from '../services/llm';
import { cn } from '../utils/cn';

interface PromptOptimizerProps {
  initialPrompt?: string;
  onOptimized?: (result: string) => void;
}

const PromptOptimizer: React.FC<PromptOptimizerProps> = ({ 
  initialPrompt = '',
  onOptimized 
}) => {
  const [values, setValues] = useState({
    role: '',
    task: '',
    context: '',
    constraints: '',
    format: ''
  });
  
  const [config, setConfig] = useState({
    temperature: 0.7,
    style: 'balanced' as 'creative' | 'balanced' | 'precise',
    tone: 'professional' as 'professional' | 'casual' | 'friendly'
  });
  
  const [templateType, setTemplateType] = useState('rolePrompt');
  const [result, setResult] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildPrompt = () => {
    const templates = {
      rolePrompt: `Act as ${values.role || 'an expert'}. Your task is to ${values.task || 'provide a solution'}.\nContext: ${values.context || 'general use case'}\nConstraints: ${values.constraints || 'be concise and clear'}\nOutput format: ${values.format || 'text'}`,
      chainOfThought: `Let's approach this step-by-step:\n1. First, understand the goal: ${values.task || 'solve the problem'}\n2. Consider the context: ${values.context || 'given situation'}\n3. Analyze requirements: ${values.constraints || 'key considerations'}\n4. Provide solution in format: ${values.format || 'detailed approach'}`,
      constraintBased: `Task: ${values.task || 'complete the objective'}\n\nPlease follow these constraints:\n- ${values.constraints || 'be specific'}\n- Use clear language\n- Provide examples\n\nAdditional requirements:\n${values.context || 'any special considerations'}\n\nOutput format: ${values.format || 'text'}`
    };

    return templates[templateType as keyof typeof templates] || templates.rolePrompt;
  };

  const handleOptimize = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const prompt = buildPrompt();
      const optimizedPrompt = await generatePrompt(prompt, templateType, config);
      setResult(optimizedPrompt);
      
      // Generate simple alternatives
      setSuggestions([
        `Alternative approach: ${optimizedPrompt}`,
        `More concise version: ${optimizedPrompt.substring(0, 200)}...`,
        `Detailed elaboration: Please provide a comprehensive response to: ${optimizedPrompt}`
      ]);
      
      onOptimized?.(optimizedPrompt);
    } catch (err) {
      console.error('Error generating prompt:', err);
      setError('Failed to generate prompt. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Template Type
        </label>
        <select
          value={templateType}
          onChange={(e) => setTemplateType(e.target.value)}
          className="input-field"
        >
          <option value="rolePrompt">Role-based Prompt</option>
          <option value="chainOfThought">Chain of Thought</option>
          <option value="constraintBased">Constraint-based</option>
        </select>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Role/Expert
          </label>
          <input
            type="text"
            value={values.role}
            onChange={(e) => setValues({ ...values, role: e.target.value })}
            className="input-field"
            placeholder="e.g., senior software engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Task
          </label>
          <textarea
            value={values.task}
            onChange={(e) => setValues({ ...values, task: e.target.value })}
            className="input-field min-h-[100px]"
            placeholder="Describe what needs to be done"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Context
          </label>
          <input
            type="text"
            value={values.context}
            onChange={(e) => setValues({ ...values, context: e.target.value })}
            className="input-field"
            placeholder="Provide relevant background information"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Constraints
          </label>
          <input
            type="text"
            value={values.constraints}
            onChange={(e) => setValues({ ...values, constraints: e.target.value })}
            className="input-field"
            placeholder="e.g., word limit, tone, audience"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Output Format
          </label>
          <input
            type="text"
            value={values.format}
            onChange={(e) => setValues({ ...values, format: e.target.value })}
            className="input-field"
            placeholder="e.g., bullet points, paragraph, code"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Style
          </label>
          <select
            value={config.style}
            onChange={(e) => setConfig({ ...config, style: e.target.value as any })}
            className="input-field"
          >
            <option value="creative">Creative</option>
            <option value="balanced">Balanced</option>
            <option value="precise">Precise</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Tone
          </label>
          <select
            value={config.tone}
            onChange={(e) => setConfig({ ...config, tone: e.target.value as any })}
            className="input-field"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Creativity
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 glass p-4 rounded-lg border border-error-500/30 flex items-center gap-3 text-error-500">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleOptimize}
        disabled={isGenerating}
        className={cn(
          "btn btn-primary w-full flex items-center justify-center gap-2",
          isGenerating && "opacity-70 cursor-not-allowed"
        )}
      >
        {isGenerating ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="h-5 w-5" />
            Generate Prompt
          </>
        )}
      </button>

      {result && (
        <motion.div
          className="mt-8 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h3 className="text-lg font-display font-bold mb-3">
              Generated Prompt
            </h3>
            <div className="glass p-4 rounded-lg relative group">
              <p className="text-neutral-200 whitespace-pre-line">{result}</p>
              <button
                onClick={() => handleCopy(result)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button className="p-2 hover:bg-white/5 rounded-lg">
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg">
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-display font-bold mb-3">
                Alternative Versions
              </h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="glass p-4 rounded-lg relative group">
                    <p className="text-neutral-300">{suggestion}</p>
                    <button
                      onClick={() => handleCopy(suggestion)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default PromptOptimizer;