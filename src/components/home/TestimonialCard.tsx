import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface TestimonialData {
  content: string;
  author: string;
  role: string;
}

interface TestimonialCardProps {
  testimonial: TestimonialData;
  delay?: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial, delay = 0 }) => {
  return (
    <motion.div
      className="glass rounded-xl p-6"
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <Quote className="h-6 w-6 text-primary-500 mb-4" />
      <p className="text-text-primary mb-4">{testimonial.content}</p>
      <div>
        <p className="font-medium text-text-primary">{testimonial.author}</p>
        <p className="text-sm text-text-secondary">{testimonial.role}</p>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;