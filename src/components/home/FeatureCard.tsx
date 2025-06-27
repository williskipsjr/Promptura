import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = 0 }) => {
  return (
    <motion.div
      className="glass rounded-xl p-6 h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="p-3 glass inline-block rounded-lg mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-display font-bold mb-3 text-text-primary">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;