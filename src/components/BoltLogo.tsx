import React from 'react';
import { motion } from 'framer-motion';

const BoltLogo: React.FC = () => {
  return (
    <motion.a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 transition-opacity duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      whileHover={{ rotate: 360 }}
      transition={{ duration: 2, type: "tween", ease: "linear" }}
      title="Built with Bolt"
    >
      <img 
        src="/black_circle_360x360.png" 
        alt="Built with Bolt"
        className="w-12 h-12"
      />
    </motion.a>
  );
};

export default BoltLogo;