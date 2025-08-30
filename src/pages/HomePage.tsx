import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Brain, ArrowRight, Wand2, Target, BarChart3, Globe, GitCompare, TrendingUp, Award } from 'lucide-react';
import { cn } from '../utils/cn';
import HeroSection from '../components/home/HeroSection';
import PromptLibrary from '../components/home/PromptLibrary';
import FeatureCard from '../components/home/FeatureCard';
import ModelCard from '../components/home/ModelCard';
import TestimonialCard from '../components/home/TestimonialCard';

const HomePage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);

  const models = [
    {
      name: 'Claude 3',
      logo: '🧠',
      description: 'High accuracy, great for complex tasks and reasoning',
      strengths: ['Complex reasoning', 'Code generation', 'Detailed analysis'],
      weaknesses: ['Knowledge cutoff', 'Conservative responses'],
    },
    {
      name: 'GPT-4',
      logo: '🤖',
      description: 'Excels at conversations and creative tasks',
      strengths: ['Natural dialogue', 'Content creation', 'Understanding context'],
      weaknesses: ['Can be verbose', 'Needs specific instructions'],
    },
    {
      name: 'DeepSeek',
      logo: '🔍',
      description: 'Optimized for code generation and factual accuracy',
      strengths: ['Technical content', 'Code generation', 'Scientific responses'],
      weaknesses: ['Creative tasks', 'Less conversational'],
    },
    {
      name: 'Gemini',
      logo: '💎',
      description: 'Google\'s multimodal AI with strong reasoning',
      strengths: ['Multimodal input', 'Fast responses', 'Integration capabilities'],
      weaknesses: ['Limited availability', 'Newer model'],
    },
    {
      name: 'Grok',
      logo: '⚡',
      description: 'Real-time information and witty responses',
      strengths: ['Real-time data', 'Conversational', 'Current events'],
      weaknesses: ['Can be too casual', 'Limited context'],
    },
    {
      name: 'Perplexity',
      logo: '🔎',
      description: 'Research-focused AI with source citations',
      strengths: ['Research tasks', 'Source citations', 'Fact-checking'],
      weaknesses: ['Limited creativity', 'Focused on facts'],
    },
    {
      name: 'Midjourney',
      logo: '🎨',
      description: 'Leading AI for image generation and artistic creation',
      strengths: ['Artistic quality', 'Style variety', 'Creative interpretation'],
      weaknesses: ['Text-only prompts', 'Subscription required'],
    },
    {
      name: 'Mistral',
      logo: '🌪️',
      description: 'Fast, efficient and precise responses',
      strengths: ['Speed', 'Conciseness', 'Good at step-by-step tasks'],
      weaknesses: ['Less creative', 'Limited context window'],
    },
  ];

  const testimonials = [
    {
      content: "Promptura revolutionized how I use AI. My prompts get better results in half the time.",
      author: "Alex Chen",
      role: "Content Creator"
    },
    {
      content: "I used to struggle with getting AI to understand what I wanted. Now my prompts are crystal clear.",
      author: "Sarah Johnson",
      role: "UX Designer"
    },
    {
      content: "As a developer, this tool has saved me countless hours debugging my prompts to get the right code.",
      author: "Michael Torres",
      role: "Software Engineer"
    }
  ];

  const advancedFeatures = [
    {
      icon: <Target className="h-8 w-8 text-pink-500" />,
      title: "A/B Testing Module",
      description: "Run two versions of a prompt on the same model and compare responses with detailed metrics."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      title: "Performance Analytics",
      description: "Track prompt performance, token usage, and optimization patterns over time."
    },
    {
      icon: <GitCompare className="h-8 w-8 text-violet-500" />,
      title: "Compare Models",
      description: "Generate optimized prompts for multiple AI models simultaneously and compare their performance with detailed scoring metrics, strengths analysis, and recommendation engine."
    }
  ];

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
  };

  const scrollToPromptGenerator = () => {
    const promptGenerator = document.getElementById('prompt-generator');
    if (promptGenerator) {
      promptGenerator.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Prompt Library Section */}
      <PromptLibrary />

      {/* Advanced Features Section */}
      <section id="advanced-features" className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="heading text-3xl md:text-4xl mb-4 text-text-primary">
                Advanced <span className="gradient-text">AI Features</span>
              </h2>
              <p className="text-text-secondary mb-12">
                Professional-grade tools for serious prompt engineers and AI practitioners.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>

          {/* Compare Models Detailed Features */}
          <motion.div
            className="mt-16 glass rounded-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <GitCompare className="h-8 w-8 text-violet-500" />
                <h3 className="text-2xl font-display font-bold text-text-primary">
                  Compare Models Features
                </h3>
              </div>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Discover which AI model works best for your specific use case with comprehensive analysis and performance metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-6 w-6 text-primary-500" />
                  <h4 className="font-display font-bold text-text-primary">Performance Scoring</h4>
                </div>
                <p className="text-sm text-text-secondary">
                  Get detailed performance scores for each model based on clarity, effectiveness, and engagement metrics.
                </p>
              </div>

              <div className="glass p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-6 w-6 text-yellow-500" />
                  <h4 className="font-display font-bold text-text-primary">Strengths Analysis</h4>
                </div>
                <p className="text-sm text-text-secondary">
                  Understand each model's unique strengths and limitations to make informed decisions for your tasks.
                </p>
              </div>

              <div className="glass p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="h-6 w-6 text-pink-500" />
                  <h4 className="font-display font-bold text-text-primary">Smart Recommendations</h4>
                </div>
                <p className="text-sm text-text-secondary">
                  Receive AI-powered recommendations on which model to use based on your prompt type and requirements.
                </p>
              </div>

              <div className="glass p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-6 w-6 text-blue-500" />
                  <h4 className="font-display font-bold text-text-primary">Optimized Prompts</h4>
                </div>
                <p className="text-sm text-text-secondary">
                  Generate model-specific optimized prompts that leverage each AI's unique capabilities and preferences.
                </p>
              </div>

              <div className="glass p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                  <h4 className="font-display font-bold text-text-primary">Side-by-Side Comparison</h4>
                </div>
                <p className="text-sm text-text-secondary">
                  Compare up to 3 models simultaneously with detailed metrics, reasoning analysis, and quality scores.
                </p>
              </div>

              <div className="glass p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="h-6 w-6 text-violet-500" />
                  <h4 className="font-display font-bold text-text-primary">Multi-Model Support</h4>
                </div>
                <p className="text-sm text-text-secondary">
                  Support for 8+ leading AI models including GPT-4, Claude 3, DeepSeek, Gemini, Grok, and more.
                </p>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link 
                to="/compare" 
                className="btn btn-primary inline-flex items-center gap-2"
              >
                Try Compare Models
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="heading text-3xl md:text-4xl mb-4 text-text-primary">Unlock the power of <span className="gradient-text">perfect prompting</span></h2>
              <p className="text-text-secondary mb-12">
                Promptura uses advanced prompt engineering techniques to optimize your interactions with any AI model.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-pink-500" />}
              title="Role-based Prompting - Primer"
              description="Enhance AI responses by assigning specific roles to guide the model's thinking process."
              delay={0.1}
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-primary-500" />}
              title="Chain-of-thought - Pro"
              description="Break down complex problems into step-by-step reasoning for more accurate results."
              delay={0.2}
            />
            <FeatureCard
              icon={<Brain className="h-8 w-8 text-violet-400" />}
              title="Constraint-focused - Ultra"
              description="Set clear boundaries and requirements to get precisely what you need."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Compare Models Section */}
      <section className="py-24 bg-background-dark">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="heading text-3xl md:text-4xl mb-4 text-text-primary">Compare results across <span className="text-pink-500">AI</span> <span className="text-violet-400">models</span></h2>
              <p className="text-text-secondary">
                Different models have different strengths. Find the perfect match for your specific tasks.
              </p>
            </motion.div>
          </div>

          <div className="flex overflow-x-auto pb-8 space-x-6 snap-x">
            {models.map((model, index) => (
              <ModelCard 
                key={index}
                model={model}
                delay={index * 0.1}
                onSelectModel={handleModelSelect}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/compare" 
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full font-display font-medium text-lg inline-flex items-center gap-2 transition-all duration-300"
            >
              Compare All Models
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Use Promptura Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 space-y-8">
                  <div className="p-4 glass rounded-xl inline-block">
                    <Wand2 className="h-8 w-8 text-pink-500" />
                  </div>
                  <h2 className="heading text-3xl md:text-4xl leading-tight text-text-primary">
                    Why use <span className="gradient-text">Promptura</span>
                  </h2>
                  <div className="space-y-4">
                    <p className="text-xl font-display font-medium text-text-primary">Talk to AIs like a pro.</p>
                    <p className="text-xl font-display font-medium text-text-primary">Your thoughts, perfectly engineered.</p>
                    <p className="text-xl font-display font-medium text-text-primary">Freedom to prompt. Effectively.</p>
                    <p className="text-xl font-display font-medium text-text-primary">Prompt smarter. Create better.</p>
                    <p className="text-xl font-display font-medium text-text-primary">One prompt to rule them all.</p>
                  </div>
                  <button 
                    onClick={scrollToPromptGenerator}
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    Try It Free <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-6">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard 
                  key={index}
                  testimonial={testimonial}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="glass rounded-3xl p-12 text-center max-w-4xl mx-auto relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="heading text-3xl md:text-4xl lg:text-5xl mb-6 text-text-primary">
                Ready to transform your AI interactions?
              </h2>
              <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
                Join thousands of users who are already creating better prompts and getting superior results.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={scrollToPromptGenerator}
                  className="btn btn-primary"
                >
                  Try Demo
                </button>
                <Link to="/compare" className="btn btn-secondary">
                  Compare Models
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;