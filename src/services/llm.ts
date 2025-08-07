interface PromptConfig {
  temperature?: number;
  maxTokens?: number;
  style?: 'creative' | 'balanced' | 'precise';
  tone?: 'professional' | 'casual' | 'friendly';
  complexity?: 'simple' | 'intermediate' | 'advanced';
  domain?: string;
}

// Model mapping for Together AI API
// Maps user-friendly model names to actual Together AI model identifiers
const MODEL_MAP: { [key: string]: string } = {
  'GPT-4': 'mistralai/Mistral-7B-Instruct-v0.2', // Proxy: High-quality reasoning model
  'Claude 3': 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO', // Proxy: Conversational and ethical reasoning
  'DeepSeek': 'deepseek-ai/deepseek-coder-33b-instruct', // Direct: Code and technical content
  'Gemini': 'google/gemma-7b-it', // Proxy: Google's open model
  'Grok': 'mistralai/Mixtral-8x7B-Instruct-v0.1', // Proxy: Fast and conversational
  'Perplexity': 'togethercomputer/RedPajama-INCITE-7B-Instruct', // Proxy: Research-focused
  'Mistral': 'mistralai/Mistral-7B-Instruct-v0.2', // Direct: Mistral model
  'Llama 2': 'meta-llama/Llama-2-70b-chat-hf', // Direct: Meta's Llama 2
  'PaLM 2': 'google/gemma-7b-it', // Proxy: Google's alternative
  'Cohere Command': 'mistralai/Mistral-7B-Instruct-v0.2', // Proxy: General purpose
  'general': 'mistralai/Mistral-7B-Instruct-v0.2' // Default fallback
};

// Get the actual model identifier for Together AI API
function getModelIdentifier(selectedModel?: string): string {
  if (!selectedModel) {
    return MODEL_MAP['general'];
  }
  
  // Return mapped model or fallback to default
  return MODEL_MAP[selectedModel] || MODEL_MAP['general'];
}

// Rate limiting variables
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_MINUTE = 10;

// Advanced prompt engineering techniques
const ADVANCED_TECHNIQUES = {
  'few-shot': {
    name: 'Few-Shot Learning',
    description: 'Provides examples to guide the AI\'s response pattern',
    complexity: 'intermediate'
  },
  'chain-of-thought': {
    name: 'Chain of Thought',
    description: 'Breaks down complex reasoning into step-by-step thinking',
    complexity: 'advanced'
  },
  'tree-of-thought': {
    name: 'Tree of Thought',
    description: 'Explores multiple reasoning paths and selects the best approach',
    complexity: 'advanced'
  },
  'self-consistency': {
    name: 'Self-Consistency',
    description: 'Generates multiple reasoning paths and finds consensus',
    complexity: 'advanced'
  },
  'role-based': {
    name: 'Role-Based (PRIMER)',
    description: 'Assigns specific expert roles to guide AI behavior',
    complexity: 'simple'
  },
  'constraint-based': {
    name: 'Constraint-Based (ULTRA)',
    description: 'Uses detailed constraints and requirements for precision',
    complexity: 'intermediate'
  },
  'meta-prompting': {
    name: 'Meta-Prompting',
    description: 'Prompts the AI to think about how to approach the task',
    complexity: 'advanced'
  },
  'recursive-prompting': {
    name: 'Recursive Prompting',
    description: 'Builds upon previous responses iteratively',
    complexity: 'advanced'
  },
  'perspective-taking': {
    name: 'Perspective Taking',
    description: 'Considers multiple viewpoints before responding',
    complexity: 'intermediate'
  },
  'socratic-method': {
    name: 'Socratic Method',
    description: 'Uses questioning to guide discovery and understanding',
    complexity: 'intermediate'
  },
  'json-prompting': {
    name: 'JSON Prompting',
    description: 'Generates structured JSON outputs for creative and technical projects',
    complexity: 'advanced'
  }
};

// Prompt openers from the Best prompt OPENERS.txt file
const promptOpeners = [
  "Act as a",
  "Imagine you're the world's best",
  "Think of yourself as a",
  "You are now",
  "Pretend you're leading",
  "Give me the perspective of a",
  "You're advising a",
  "Step into the mindset of",
  "As a master of",
  "Channel the voice of",
  "Embody the expertise of a",
  "Transform into a",
  "Assume the role of a",
  "Position yourself as the",
  "Take on the persona of a"
];

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    requestCount = 0;
    lastResetTime = now;
  }
  return requestCount < MAX_REQUESTS_PER_MINUTE;
}

function parseAIResponse(text: string): string {
  try {
    // Clean up the response by removing any markdown formatting or extra text
    let cleanedText = text.trim();
    
    // Remove common AI response prefixes
    const prefixes = [
      'Here is the optimized prompt:',
      'Here\'s the optimized prompt:',
      'Optimized prompt:',
      'The optimized prompt is:',
      'Here is your optimized prompt:',
      'Here\'s your optimized prompt:'
    ];
    
    for (const prefix of prefixes) {
      if (cleanedText.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleanedText = cleanedText.substring(prefix.length).trim();
        break;
      }
    }
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```') && cleanedText.endsWith('```')) {
      cleanedText = cleanedText.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
    }
    
    // Remove quotes if the entire response is wrapped in them
    if ((cleanedText.startsWith('"') && cleanedText.endsWith('"')) ||
        (cleanedText.startsWith("'") && cleanedText.endsWith("'"))) {
      cleanedText = cleanedText.slice(1, -1).trim();
    }
    
    return cleanedText;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return text.trim();
  }
}

function getRandomOpener(): string {
  return promptOpeners[Math.floor(Math.random() * promptOpeners.length)];
}

function getFallbackPrompt(originalPrompt: string, type: string | null, selectedModel?: string): string {
  const modelContext = selectedModel ? ` (optimized for ${selectedModel})` : '';
  const opener = getRandomOpener();
  
  switch (type) {
    case 'few-shot':
      return `${opener} expert in the relevant field. I'll provide you with examples to guide your response pattern.

Task: ${originalPrompt}

Example 1: [Provide a relevant example of the desired output format and quality]
Example 2: [Provide another example showing variation while maintaining quality]
Example 3: [Provide a third example to establish the pattern]

Now, following the pattern established by these examples, please provide your response to the task above. Maintain the same level of detail, structure, and quality as demonstrated in the examples.${modelContext}`;

    case 'tree-of-thought':
      return `${opener} strategic thinker tasked with exploring multiple approaches to solve this problem.

Problem: ${originalPrompt}

Please think through this systematically:

Branch 1 - Direct Approach:
- What would be the most straightforward solution?
- What are the pros and cons of this approach?

Branch 2 - Creative Approach:
- What innovative or unconventional methods could work?
- How might this provide unique advantages?

Branch 3 - Systematic Approach:
- What methodical, step-by-step process would ensure thoroughness?
- How can we minimize risks and maximize success?

After exploring these three branches, synthesize the best elements from each to provide an optimal solution.${modelContext}`;

    case 'self-consistency':
      return `${opener} expert analyst. I need you to approach this problem from multiple angles to ensure consistency and accuracy.

Task: ${originalPrompt}

Please provide three independent reasoning paths:

Reasoning Path 1:
[Approach the problem from one perspective]

Reasoning Path 2:
[Approach the same problem from a different angle]

Reasoning Path 3:
[Use a third distinct approach to the problem]

Final Answer:
After comparing all three reasoning paths, provide a consensus answer that incorporates the most reliable and consistent elements from each approach.${modelContext}`;

    case 'meta-prompting':
      return `${opener} meta-cognitive expert. Before addressing the main task, let's think about how to approach it optimally.

Main Task: ${originalPrompt}

Meta-Analysis:
1. What type of problem is this? (analytical, creative, technical, etc.)
2. What expertise or knowledge domains are most relevant?
3. What potential pitfalls or challenges should be anticipated?
4. What would constitute a high-quality response?
5. What approach or methodology would be most effective?

Based on this meta-analysis, now provide a comprehensive response to the main task, applying the optimal approach you've identified.${modelContext}`;

    case 'recursive-prompting':
      return `${opener} iterative problem solver. We'll build the solution step by step, refining as we go.

Initial Task: ${originalPrompt}

Step 1 - Initial Response:
Provide your first attempt at addressing this task.

Step 2 - Self-Evaluation:
Critically evaluate your initial response. What could be improved? What's missing?

Step 3 - Refined Response:
Based on your self-evaluation, provide an improved version that addresses the identified shortcomings.

Step 4 - Final Optimization:
Make any final adjustments to create the most comprehensive and effective response.${modelContext}`;

    case 'perspective-taking':
      return `${opener} multi-perspective analyst. Let's examine this from various viewpoints before reaching a conclusion.

Central Issue: ${originalPrompt}

Perspective 1 - Stakeholder A:
How would [relevant stakeholder] view this issue? What are their priorities and concerns?

Perspective 2 - Stakeholder B:
How would [another relevant stakeholder] approach this differently? What unique insights do they bring?

Perspective 3 - External Observer:
What would an objective, outside observer notice that insiders might miss?

Perspective 4 - Future Impact:
How might this look from a long-term perspective? What are the broader implications?

Synthesis:
Integrate insights from all perspectives to provide a balanced, comprehensive response.${modelContext}`;

    case 'socratic-method':
      return `${opener} Socratic questioner. Let's explore this topic through guided inquiry.

Topic: ${originalPrompt}

Let me guide you through a series of questions to deepen understanding:

1. What do we already know about this topic?
2. What assumptions are we making?
3. What evidence supports our current understanding?
4. What questions does this raise?
5. How might someone disagree with this perspective?
6. What are the implications of our conclusions?
7. How does this connect to broader principles or patterns?

Please work through each question thoughtfully, then provide a comprehensive response based on your inquiry.${modelContext}`;

    case 'role-based':
      return `${opener} senior specialist in the field relevant to this task. Your task is to provide expert guidance and comprehensive analysis.

Context: ${originalPrompt}
Constraints: Provide detailed, professional-level advice with clear reasoning and actionable insights.
Output format: Structured response with clear headings, bullet points for key takeaways, and specific next steps.${modelContext}`;

    case 'chain-of-thought':
      return `**Objective**: ${originalPrompt}

**Approach**:
1. First, understand the core objective and requirements
2. Analyze the key components and their relationships
3. Consider multiple approaches and their implications
4. Develop a structured solution with clear reasoning
5. Include verification steps and quality checks

**Instructions**: Provide a comprehensive response following this logical progression with detailed explanations for each step.${modelContext}`;

    case 'constraint-based':
      return `**Task**: ${originalPrompt}

**Requirements**:
- Provide specific, actionable guidance
- Use clear, professional language
- Include relevant examples where helpful
- Consider multiple perspectives and approaches

**Output Format**: Structured analysis with clear sections, practical recommendations, and implementation guidance.

**Quality Standards**: Ensure accuracy, completeness, and practical applicability of all recommendations.${modelContext}`;

    default:
      return `${opener} expert consultant. Your task is to provide comprehensive, actionable guidance on the following:

${originalPrompt}

Context: Provide professional-level analysis with clear reasoning and practical insights.
Constraints: Be specific, actionable, and well-structured in your response.
Output format: Clear, organized response with key points, examples, and next steps.${modelContext}`;
  }
}

// Intent detection for auto-rewrite
function detectIntent(prompt: string): { intent: string; suggestions: string[] } {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('write') || lowerPrompt.includes('create') || lowerPrompt.includes('generate')) {
    return {
      intent: 'creation',
      suggestions: [
        'Specify the target audience',
        'Add tone and style requirements',
        'Include format specifications',
        'Mention word count or length'
      ]
    };
  }
  
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('review') || lowerPrompt.includes('evaluate')) {
    return {
      intent: 'analysis',
      suggestions: [
        'Define evaluation criteria',
        'Specify the analysis framework',
        'Request specific metrics or scores',
        'Ask for actionable recommendations'
      ]
    };
  }
  
  if (lowerPrompt.includes('explain') || lowerPrompt.includes('describe') || lowerPrompt.includes('what is')) {
    return {
      intent: 'explanation',
      suggestions: [
        'Specify the audience level (beginner/expert)',
        'Request examples or analogies',
        'Ask for step-by-step breakdown',
        'Include practical applications'
      ]
    };
  }
  
  if (lowerPrompt.includes('code') || lowerPrompt.includes('program') || lowerPrompt.includes('function')) {
    return {
      intent: 'coding',
      suggestions: [
        'Specify programming language',
        'Include error handling requirements',
        'Request code comments',
        'Mention performance considerations'
      ]
    };
  }
  
  return {
    intent: 'general',
    suggestions: [
      'Add specific context or background',
      'Define the desired outcome',
      'Specify constraints or requirements',
      'Include examples if helpful'
    ]
  };
}

// Auto-rewrite functionality
export async function autoRewritePrompt(
  prompt: string,
  rewriteType: 'clarity' | 'brevity' | 'creativity' | 'specificity'
): Promise<string> {
  const instructions = {
    clarity: 'Rewrite this prompt to be clearer and more specific, removing ambiguity and adding precise instructions',
    brevity: 'Rewrite this prompt to be more concise while maintaining all essential information and requirements',
    creativity: 'Rewrite this prompt to encourage more creative and innovative responses, adding elements that inspire original thinking',
    specificity: 'Rewrite this prompt to be more specific and detailed, adding concrete requirements and clear success criteria'
  };
  
  const rewritePrompt = `${instructions[rewriteType]}:

Original prompt: "${prompt}"

Provide only the rewritten prompt, no explanations.`;
  
  return generatePrompt(rewritePrompt, 'general', { temperature: 0.3 });
}

// Token estimation
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Prompt quality scoring
export function scorePromptQuality(prompt: string): {
  score: number;
  factors: { [key: string]: { score: number; feedback: string } };
} {
  const factors = {
    clarity: { score: 0, feedback: '' },
    specificity: { score: 0, feedback: '' },
    structure: { score: 0, feedback: '' },
    completeness: { score: 0, feedback: '' }
  };
  
  // Clarity scoring
  const hasRole = /act as|you are|imagine you're/i.test(prompt);
  const hasContext = /context|background|situation/i.test(prompt);
  factors.clarity.score = (hasRole ? 25 : 0) + (hasContext ? 25 : 0) + (prompt.length > 50 ? 25 : 0) + 25;
  factors.clarity.feedback = hasRole ? 'Good role definition' : 'Consider adding a specific role';
  
  // Specificity scoring
  const hasConstraints = /format|length|style|tone|audience/i.test(prompt);
  const hasExamples = /example|such as|like|including/i.test(prompt);
  factors.specificity.score = (hasConstraints ? 40 : 0) + (hasExamples ? 30 : 0) + 30;
  factors.specificity.feedback = hasConstraints ? 'Good constraints specified' : 'Add more specific requirements';
  
  // Structure scoring
  const hasNumberedSteps = /\d+\./g.test(prompt);
  const hasBulletPoints = /[-•*]/g.test(prompt);
  const hasHeaders = /\*\*.*\*\*|#/g.test(prompt);
  factors.structure.score = (hasNumberedSteps ? 30 : 0) + (hasBulletPoints ? 30 : 0) + (hasHeaders ? 40 : 0);
  factors.structure.feedback = hasHeaders ? 'Well structured' : 'Consider adding structure with headers or lists';
  
  // Completeness scoring
  const hasTask = /task|goal|objective|purpose/i.test(prompt);
  const hasOutput = /output|result|response|format/i.test(prompt);
  factors.completeness.score = (hasTask ? 50 : 0) + (hasOutput ? 50 : 0);
  factors.completeness.feedback = hasTask && hasOutput ? 'Complete prompt' : 'Add clear task and output requirements';
  
  const overallScore = Object.values(factors).reduce((sum, factor) => sum + factor.score, 0) / 4;
  
  return { score: overallScore, factors };
}

// Get available techniques based on complexity level
export function getAvailableTechniques(complexity: 'simple' | 'intermediate' | 'advanced' = 'intermediate'): typeof ADVANCED_TECHNIQUES {
  const complexityLevels = {
    simple: ['simple'],
    intermediate: ['simple', 'intermediate'],
    advanced: ['simple', 'intermediate', 'advanced']
  };
  
  const allowedComplexities = complexityLevels[complexity];
  
  return Object.fromEntries(
    Object.entries(ADVANCED_TECHNIQUES).filter(([_, technique]) => 
      allowedComplexities.includes(technique.complexity)
    )
  );
}

// Get technique recommendation based on prompt content
export function recommendTechnique(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  // Complex reasoning tasks
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('compare') || lowerPrompt.includes('evaluate')) {
    return 'tree-of-thought';
  }
  
  // Creative tasks
  if (lowerPrompt.includes('creative') || lowerPrompt.includes('innovative') || lowerPrompt.includes('brainstorm')) {
    return 'perspective-taking';
  }
  
  // Learning or explanation tasks
  if (lowerPrompt.includes('explain') || lowerPrompt.includes('teach') || lowerPrompt.includes('understand')) {
    return 'socratic-method';
  }
  
  // Pattern-based tasks
  if (lowerPrompt.includes('example') || lowerPrompt.includes('format') || lowerPrompt.includes('style')) {
    return 'few-shot';
  }
  
  // Complex problem-solving
  if (lowerPrompt.includes('solve') || lowerPrompt.includes('strategy') || lowerPrompt.includes('plan')) {
    return 'chain-of-thought';
  }
  
  // Default to role-based for general tasks
  return 'role-based';
}

export async function generatePrompt(
  prompt: string,
  type: string | null,
  config: PromptConfig = {},
  selectedModel?: string
): Promise<string> {
  // Check rate limiting first
  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded, using fallback prompt');
    return getFallbackPrompt(prompt, type, selectedModel);
  }

  try {
    const apiKey = import.meta.env.VITE_TOGETHER_API_KEY;
    
    if (!apiKey) {
      console.warn('Together AI API key not configured, using fallback prompt');
      return getFallbackPrompt(prompt, type, selectedModel);
    }

    requestCount++;
    const optimizationPrompt = createOptimizationPrompt(prompt, type, selectedModel, config);
    
    // Get the actual model identifier for the API call
    const modelIdentifier = getModelIdentifier(selectedModel);
    
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelIdentifier,
        messages: [
          {
            role: 'system',
            content: `You are an expert prompt engineer specializing in advanced prompt engineering techniques${selectedModel ? ` with expertise in optimizing prompts for ${selectedModel}` : ''}. Your ONLY task is to transform the given prompt into an optimized version using the specified advanced technique. Return ONLY the final optimized prompt - no explanations, no commentary, no additional text. Just the clean, optimized prompt ready to use.`
          },
          {
            role: 'user',
            content: optimizationPrompt
          }
        ],
        temperature: config.temperature ?? 0.2,
        max_tokens: config.maxTokens ?? 1200,
        top_p: 0.8,
        repetition_penalty: 1.1
      }),
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage += `. ${errorData.error.message}`;
        }
        
        if (response.status === 401) {
          errorMessage += ' - Please check that your Together AI API key is valid and properly configured in your .env file.';
        } else if (response.status === 403) {
          errorMessage += ' - Your API key may not have access to this model or feature.';
        } else if (response.status === 429) {
          errorMessage += ' - Rate limit exceeded. Please try again in a moment.';
          console.warn('API rate limit exceeded, using fallback prompt');
          return getFallbackPrompt(prompt, type, selectedModel);
        } else if (response.status >= 500) {
          errorMessage += ' - Together AI service is experiencing issues. Please try again later.';
        }
      } catch (parseError) {
        // If we can't parse the error response, use the basic error message
      }
      
      console.warn('API request failed, using fallback prompt:', errorMessage);
      return getFallbackPrompt(prompt, type, selectedModel);
    }

    const result = await response.json();

    if (!result.choices?.[0]?.message?.content) {
      console.warn('Invalid response from Together AI API, using fallback prompt');
      return getFallbackPrompt(prompt, type, selectedModel);
    }

    const optimizedPrompt = parseAIResponse(result.choices[0].message.content);
    
    // Validate that we got a meaningful response
    if (optimizedPrompt.length < 50 || optimizedPrompt.toLowerCase().includes('i cannot') || optimizedPrompt.toLowerCase().includes('i\'m sorry')) {
      console.warn('Received inadequate response from AI, using fallback prompt');
      return getFallbackPrompt(prompt, type, selectedModel);
    }

    return optimizedPrompt;
  } catch (error) {
    console.error('Error generating prompt:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error, using fallback prompt');
      return getFallbackPrompt(prompt, type, selectedModel);
    }
    
    console.warn('Unexpected error, using fallback prompt');
    return getFallbackPrompt(prompt, type, selectedModel);
  }
}

function createOptimizationPrompt(prompt: string, type: string | null, selectedModel?: string, config: PromptConfig = {}): string {
  const modelContext = selectedModel ? `\n\nIMPORTANT: Optimize specifically for ${selectedModel}, considering its unique strengths and prompt preferences.` : '';
  const complexityContext = config.complexity ? `\n\nComplexity Level: ${config.complexity}` : '';
  const domainContext = config.domain ? `\n\nDomain Focus: ${config.domain}` : '';
  const opener = getRandomOpener();
  
  switch (type) {
    case 'few-shot':
      return `Transform this prompt using the FEW-SHOT LEARNING technique. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this advanced structure but remove all asterisks and formatting:
${opener} [expert role] with extensive experience in [relevant domain].

Task: [Clear task description]

Here are examples to guide your response:

Example 1:
Input: [Relevant example input]
Output: [High-quality example output showing desired format and depth]

Example 2:
Input: [Second example input with variation]
Output: [Second example output maintaining quality standards]

Example 3:
Input: [Third example input]
Output: [Third example output establishing clear pattern]

Now, following the pattern and quality demonstrated in these examples, please [specific instruction for the main task].

Requirements:
- Start with "${opener}" followed by the expert role
- Provide 2-3 high-quality examples that establish the pattern
- Make examples relevant to the specific task
- Ensure examples show the desired output format and quality level
- Do NOT use asterisks, bold markers, or markdown formatting
- Return clean, readable text

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    case 'tree-of-thought':
      return `Transform this prompt using the TREE-OF-THOUGHT technique. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this advanced structure but remove all asterisks and formatting:
${opener} strategic problem solver tasked with exploring multiple solution paths.

Problem: [Clear problem statement]

Please explore this systematically through multiple branches:

Branch 1 - [First approach name]:
- What would this approach involve?
- What are the key steps and considerations?
- What are the potential advantages and limitations?

Branch 2 - [Second approach name]:
- How does this approach differ from the first?
- What unique benefits does it offer?
- What challenges might arise?

Branch 3 - [Third approach name]:
- What alternative perspective does this provide?
- How might this address limitations of other approaches?
- What innovative elements does it introduce?

Synthesis:
After exploring all branches, identify the strongest elements from each and combine them into an optimal solution that leverages the best aspects of multiple approaches.

Requirements:
- Start with "${opener}" followed by strategic problem solver role
- Create 3 distinct solution branches with different approaches
- Analyze pros and cons for each branch
- Synthesize the best elements into a final solution
- Do NOT use asterisks, bold markers, or markdown formatting
- Use clear section breaks with plain text

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    case 'self-consistency':
      return `Transform this prompt using the SELF-CONSISTENCY technique. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this advanced structure but remove all asterisks and formatting:
${opener} analytical expert who approaches problems from multiple independent angles to ensure accuracy and reliability.

Task: [Clear task description]

Please provide multiple independent reasoning paths:

Reasoning Path 1 - [First perspective]:
Approach this problem using [specific methodology or viewpoint]. Work through the logic step by step and reach a conclusion.

Reasoning Path 2 - [Second perspective]:
Now approach the same problem from [different methodology or angle]. Use independent reasoning to reach your conclusion.

Reasoning Path 3 - [Third perspective]:
Finally, tackle this using [third distinct approach]. Apply this methodology thoroughly and arrive at your answer.

Consensus Analysis:
Compare the conclusions from all three reasoning paths. Identify areas of agreement and any discrepancies. Provide a final answer that represents the most consistent and reliable elements across all approaches.

Requirements:
- Start with "${opener}" followed by analytical expert role
- Use three genuinely different reasoning approaches
- Ensure each path is independent and thorough
- Analyze consistency across all paths
- Provide a consensus-based final answer
- Do NOT use asterisks, bold markers, or markdown formatting
- Use clear section breaks with plain text

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    case 'meta-prompting':
      return `Transform this prompt using the META-PROMPTING technique. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this advanced structure but remove all asterisks and formatting:
${opener} meta-cognitive expert who thinks strategically about how to approach problems before solving them.

Primary Task: [Clear task description]

Meta-Analysis Phase:
Before addressing the main task, please analyze:

1. Problem Classification: What type of challenge is this? (analytical, creative, technical, strategic, etc.)

2. Required Expertise: What knowledge domains and skills are most relevant for optimal performance?

3. Potential Challenges: What obstacles, biases, or pitfalls should be anticipated and avoided?

4. Success Criteria: What would constitute an excellent response? What quality markers should be targeted?

5. Optimal Methodology: Based on the above analysis, what approach or framework would be most effective?

6. Resource Allocation: How should effort and attention be distributed across different aspects of the task?

Implementation Phase:
Now, using insights from your meta-analysis, provide a comprehensive response to the primary task. Apply the optimal methodology you identified and ensure your response meets the quality criteria you established.

Requirements:
- Start with "${opener}" followed by meta-cognitive expert role
- Complete thorough meta-analysis before addressing main task
- Use insights from meta-analysis to guide your approach
- Ensure final response reflects strategic thinking
- Do NOT use asterisks, bold markers, or markdown formatting
- Use clear section breaks with plain text

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    case 'recursive-prompting':
      return `Transform this prompt using the RECURSIVE PROMPTING technique. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this advanced structure but remove all asterisks and formatting:
${opener} iterative problem solver who builds solutions through progressive refinement and self-improvement.

Initial Challenge: [Clear task description]

Iteration 1 - First Attempt:
Provide your initial response to the challenge. Focus on addressing the core requirements with your best current understanding.

Iteration 2 - Critical Review:
Step back and critically evaluate your first attempt. Ask yourself:
- What aspects are strong and should be preserved?
- What elements could be improved or expanded?
- What important considerations might have been missed?
- How could the response be more effective or comprehensive?

Iteration 3 - Enhanced Version:
Based on your critical review, provide an improved version that addresses the identified shortcomings while building on the strengths of your initial attempt.

Iteration 4 - Final Optimization:
Perform one final review and refinement. Polish the response to ensure it represents your highest quality work and most complete understanding of the challenge.

Requirements:
- Start with "${opener}" followed by iterative problem solver role
- Show clear progression through each iteration
- Include genuine self-criticism and improvement
- Build upon previous iterations rather than starting over
- Demonstrate learning and refinement throughout the process
- Do NOT use asterisks, bold markers, or markdown formatting
- Use clear section breaks with plain text

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    case 'perspective-taking':
      return `Transform this prompt using the PERSPECTIVE-TAKING technique. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this advanced structure but remove all asterisks and formatting:
${opener} multi-perspective analyst who examines issues from various stakeholder viewpoints before reaching comprehensive conclusions.

Central Issue: [Clear issue or task description]

Perspective 1 - [Relevant Stakeholder A]:
How would [specific stakeholder] view this issue? Consider their:
- Primary concerns and priorities
- Unique constraints and limitations
- Success metrics and desired outcomes
- Potential objections or resistance points

Perspective 2 - [Relevant Stakeholder B]:
How would [different stakeholder] approach this differently? Analyze their:
- Distinct viewpoint and interests
- Available resources and capabilities
- Risk tolerance and decision-making style
- Preferred solutions and methodologies

Perspective 3 - [External Observer]:
What would an objective, uninvolved observer notice? Consider:
- Patterns that insiders might miss
- Assumptions that may be unquestioned
- Alternative interpretations of the situation
- Broader context and implications

Perspective 4 - [Future/Long-term View]:
How might this look from a long-term perspective? Examine:
- Potential future developments and trends
- Sustainability and scalability considerations
- Unintended consequences and ripple effects
- Historical precedents and lessons learned

Integrated Analysis:
Synthesize insights from all perspectives to provide a balanced, comprehensive response that acknowledges multiple viewpoints and incorporates the most valuable elements from each.

Requirements:
- Start with "${opener}" followed by multi-perspective analyst role
- Include 4 distinct and relevant perspectives
- Ensure each perspective offers unique insights
- Synthesize all viewpoints into a comprehensive conclusion
- Do NOT use asterisks, bold markers, or markdown formatting
- Use clear section breaks with plain text

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    case 'socratic-method':
      return `Transform this prompt using the SOCRATIC METHOD technique. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this advanced structure but remove all asterisks and formatting:
${opener} Socratic facilitator who guides discovery through systematic questioning and inquiry.

Topic for Exploration: [Clear topic or question]

Guided Inquiry Process:

Question 1 - Foundation:
What do we currently know or assume about this topic? What evidence supports our current understanding?

Question 2 - Assumptions:
What underlying assumptions are we making? Which of these assumptions should be questioned or examined more closely?

Question 3 - Evidence and Sources:
What evidence supports our current perspective? How reliable are our sources of information? What might we be missing?

Question 4 - Alternative Viewpoints:
How might someone with a different background or perspective view this issue? What valid counterarguments exist?

Question 5 - Implications and Consequences:
If our current understanding is correct, what are the logical implications? What would be the consequences of acting on this understanding?

Question 6 - Broader Connections:
How does this topic connect to broader principles, patterns, or systems? What analogies or parallels can we draw?

Question 7 - Remaining Questions:
What important questions remain unanswered? What would we need to learn or investigate further to deepen our understanding?

Synthesis Through Inquiry:
Based on your exploration through these questions, provide a comprehensive response that demonstrates the deeper understanding gained through this systematic inquiry process.

Requirements:
- Start with "${opener}" followed by Socratic facilitator role
- Work through each question systematically and thoughtfully
- Use the inquiry process to build deeper understanding
- Ensure final response reflects insights gained through questioning
- Do NOT use asterisks, bold markers, or markdown formatting
- Use clear section breaks with plain text

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    case 'role-based':
      return `Transform this prompt using the ROLE-BASED template structure. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this structure but remove all asterisks and formatting:
${opener} [specific expert role]. Your task is to [clear goal].
Context: [relevant background or use case].
Constraints: [word limit, tone, audience, format requirements].
Output format: [specific format like bullet points, essay, code, etc.].

Requirements:
- Start directly with "${opener}" followed by the expert role
- Make the goal crystal clear and actionable
- Add relevant context that helps the AI understand the situation
- Include appropriate constraints (tone, length, audience, etc.)
- Specify the exact output format needed
- Do NOT use asterisks or markdown formatting
- Return clean, readable text

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    case 'chain-of-thought':
      return `Transform this prompt using the CHAIN-OF-THOUGHT template structure. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this structure but remove all asterisks and bold formatting:
${opener} [expert role] tasked with [mission].

Context: [Background, challenges, constraints, expectations]

Approach: 
1. [Analysis step]
2. [Planning step] 
3. [Execution step]
4. [Verification step]

Response Format: [Structured output format]

Instructions: [Quality guidelines and best practices]

Requirements:
- Start with "${opener}" followed by the expert role
- Create a logical step-by-step approach
- Break down complex reasoning into clear phases
- Include verification or quality check steps
- Specify detailed response format
- Do NOT use asterisks, bold markers, or markdown formatting
- Use clear section breaks with plain text

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    case 'constraint-based':
      return `Transform this prompt using the CONSTRAINT-BASED template structure. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this advanced structure but remove all asterisks and formatting:
Prompt Title: [Concise, descriptive title]

Role & Framing: ${opener} [ultra-specialized expert] tasked with [specific mission].

Context: [Multi-layered context including current challenges, constraints, and expectations]

Output Objectives: 
- [Objective 1]
- [Objective 2] 
- [Objective 3]

Detailed Requirements:
1. [Specific requirement with constraints]
2. [Quality standards and limitations]
3. [Format and structure specifications]

Meta Instructions: 
- Use recursive reasoning and verification
- Challenge assumptions where appropriate
- Provide multiple approaches if applicable

Response Guidelines: [Structure requirements and terminology]

Requirements:
- Start with "${opener}" in the Role & Framing section
- Create precise specifications and quality controls
- Include multiple layers of context
- Add meta-level instructions for better reasoning
- Specify exact output format and structure
- Do NOT use asterisks, bold markers, or markdown formatting
- Use clear section breaks with plain text

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    case 'json-prompting':
      return `Transform this prompt using the JSON PROMPTING technique. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Use this advanced structure but remove all asterisks and formatting:
${opener} expert JSON architect and creative director specializing in structured content generation for multimedia projects.

Primary Objective: [Clear task description]

JSON Structure Requirements:
Your task is to generate a comprehensive JSON object that captures all essential elements of the request. The JSON should include these key sections:

Core Information:
- title: A compelling, descriptive title for the project
- description: Detailed narrative describing the main concept and execution
- style: Visual and aesthetic approach (e.g., "cinematic", "minimalist", "luxury")

Technical Specifications:
- camera: Object describing camera movements, framing, and cinematography
- lighting: Detailed lighting setup and mood specifications
- environment: Setting, location, and environmental details

Creative Elements:
- elements: Array of all visual components, props, and design elements
- motion: Description of animations, transitions, and dynamic movements
- effects: Special effects, visual enhancements, and post-production elements
- sound_effects: Audio elements and sound design specifications

Project Metadata:
- mood: Overall emotional tone and atmosphere
- color_palette: Specific colors, materials, and visual themes
- style_reference: Inspiration sources and aesthetic references
- keywords: Array of relevant tags and descriptors
- text: Any text overlays or copy requirements

Execution Guidelines:
1. Ensure all JSON is valid and properly formatted
2. Use descriptive, actionable language in all fields
3. Include specific technical details for implementation
4. Consider the sequence of events and timing
5. Provide comprehensive coverage of all project aspects
6. Use arrays for multiple items (elements, keywords, effects)
7. Include both creative and technical specifications

Output Format: Return a complete, valid JSON object that can be directly used for project implementation. Ensure proper nesting, correct syntax, and comprehensive coverage of all requirements.

Quality Standards: The JSON should be production-ready, technically accurate, and creatively inspiring while maintaining clear structure and actionable details.

Requirements:
- Start with "${opener}" followed by expert JSON architect role
- Generate a complete, valid JSON structure
- Include all essential project elements and specifications
- Ensure technical accuracy and creative depth
- Do NOT use asterisks, bold markers, or markdown formatting
- Return only the final optimized prompt

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;

    default:
      return `Optimize this prompt for better AI interactions using advanced prompt engineering techniques. Return ONLY the optimized prompt without asterisks or formatting markers.

Original prompt: "${prompt}"

Transform it using this structure but remove all formatting:
${opener} [role]. Your task is to [goal].
Context: [background or use case].
Constraints: [word limit, tone, audience, etc.].
Output format: [bullet list, blog, email, code, etc.].

Requirements:
1. Start with "${opener}" followed by a specific expert role
2. Make the instructions crystal clear and actionable
3. Add relevant context and background information
4. Include appropriate constraints (tone, length, audience, format)
5. Specify the exact output format needed
6. Do NOT use asterisks, bold markers, or markdown formatting
7. Return clean, readable text

Make the prompt more specific, structured, and likely to produce high-quality results.

Return only the final optimized prompt.${modelContext}${complexityContext}${domainContext}`;
  }
}

// Export additional utility functions
export { detectIntent, ADVANCED_TECHNIQUES };