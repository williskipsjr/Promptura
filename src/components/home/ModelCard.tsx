import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ModelData {
  name: string;
  logo: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

interface ModelCardProps {
  model: ModelData;
  delay?: number;
  onSelectModel: (modelName: string) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, delay = 0, onSelectModel }) => {
  const handleGeneratePrompt = () => {
    onSelectModel(model.name);
    // Scroll to prompt generator
    const promptGenerator = document.getElementById('prompt-generator');
    if (promptGenerator) {
      promptGenerator.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <motion.div
      className="glass rounded-xl p-6 min-w-[300px] md:min-w-[320px] snap-center flex-shrink-0"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">{model.logo}</div>
        <h3 className="text-xl font-display font-bold text-text-primary">{model.name}</h3>
      </div>
      
      <p className="text-text-secondary mb-4">{model.description}</p>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium text-text-secondary mb-2">Strengths</h4>
        <ul className="space-y-2">
          {model.strengths.map((strength, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-text-primary">
              <Check className="h-4 w-4 text-success-500" />
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium text-text-secondary mb-2">Weaknesses</h4>
        <ul className="space-y-2">
          {model.weaknesses.map((weakness, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="text-error-500 mt-0.5">•</span>
              <span>{weakness}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <button 
        onClick={handleGeneratePrompt}
        className="w-full py-2.5 text-sm font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors"
      >
        Generate Prompt
      </button>
    </motion.div>
  );
};

export default ModelCard;