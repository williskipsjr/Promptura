import React from 'react';
import { motion } from 'framer-motion';
import PromptABTesting from '../components/PromptABTesting';

const ABTestingPage: React.FC = () => {
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PromptABTesting />
        </motion.div>
      </div>
    </div>
  );
};

// In your AB testing page
const saveAbTestResult = async (testData) => {
  const { data, error } = await supabase
    .from('ab_test_results')
    .insert({
      user_id: user?.id, // or null for anonymous users
      original_prompt: testData.originalPrompt,
      optimized_prompt: testData.optimizedPrompt,
      prompt_a: testData.promptA,
      prompt_b: testData.promptB,
      winner_prompt: testData.winnerPrompt,
      model_used: testData.modelUsed,
      prompt_type: 'A/B Test',
      source_page: 'ab-testing',
      metrics: testData.metrics // JSONB data
    });
    
  if (error) console.error('Error saving AB test:', error);
  return data;
};

export default ABTestingPage;