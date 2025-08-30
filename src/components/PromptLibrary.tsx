import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';

const PromptLibrary: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <Wand2 className="w-16 h-16 mx-auto mb-6 text-primary" />
        <h1 className="text-3xl font-bold mb-4">Prompt Library</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          The Prompt Library has been replaced with our new Promptura interface.
        </p>
        <button
          onClick={() => navigate('/promptura')}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Go to Promptura
        </button>
      </motion.div>
    </div>
  );
};

export default PromptLibrary;