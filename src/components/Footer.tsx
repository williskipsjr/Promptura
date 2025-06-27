import React from 'react';
import { Sparkles, Zap, Brain, Star, Lightbulb, Rocket } from 'lucide-react';

const Footer: React.FC = () => {
  const promtingTips = [
    "Be specific, not vague",
    "Give examples when possible",
    "Ask for step-by-step reasoning",
    "Set the context first",
    "Use positive instructions"
  ];

  const funFacts = [
    "The word 'prompt' comes from Latin 'promptus' meaning 'ready'",
    "Good prompts are like good questions - they unlock better answers",
    "The art of prompting is half psychology, half precision",
    "Every AI conversation starts with a single prompt"
  ];

  return (
    <footer className="py-12 bg-background-dark/50 backdrop-blur-md mt-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-dark/80 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative">
        {/* Main Brand Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="text-pink-500 h-8 w-8" />
            <span className="font-display text-2xl font-bold gradient-text">Promptura</span>
          </div>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Master the art of prompting. Talk to any AI — better, faster, smarter.
          </p>
        </div>

        {/* Fun Content Grid */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Prompting Tips */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-yellow-400 h-5 w-5" />
              <h3 className="font-display font-bold text-lg text-text-primary">Quick Prompting Tips</h3>
            </div>
            <ul className="space-y-2">
              {promtingTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-text-secondary text-sm">
                  <Zap className="text-blue-400 h-4 w-4 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Fun Facts */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="text-cyan-400 h-5 w-5" />
              <h3 className="font-display font-bold text-lg text-text-primary">Did You Know?</h3>
            </div>
            <div className="space-y-3">
              {funFacts.slice(0, 2).map((fact, index) => (
                <p key={index} className="text-text-secondary text-sm flex items-start gap-2">
                  <Star className="text-purple-400 h-4 w-4 mt-0.5 flex-shrink-0" />
                  {fact}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Motivational Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full px-6 py-3 border border-pink-500/30">
            <Rocket className="text-pink-400 h-5 w-5" />
            <span className="text-text-primary font-medium">
              "The best prompt is the one that gets you exactly what you need"
            </span>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border-color text-center">
          <p className="text-neutral-500 text-sm mb-3">
            © {new Date().getFullYear()} Promptura. Crafted with ✨ for better AI conversations.
          </p>
          <p className="text-neutral-500 text-xs max-w-2xl mx-auto">
            All AI model names (e.g., GPT-4, Claude 3, DeepSeek) are trademarks of their respective owners. 
            Promptura is an independent tool for testing and improving your prompts. 
            Model outputs are generated via publicly available APIs for educational purposes.
          </p>
          
          <div className="flex justify-center gap-6 mt-6">
            <a href="/privacy" className="text-neutral-500 hover:text-text-primary text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-neutral-500 hover:text-text-primary text-sm transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;