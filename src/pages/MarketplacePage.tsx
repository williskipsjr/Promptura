import React from 'react';
import { motion } from 'framer-motion';
import PromptMarketplace from '../components/PromptMarketplace';

const MarketplacePage: React.FC = () => {
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PromptMarketplace />
        </motion.div>
      </div>
    </div>
  );
};

export default MarketplacePage;