import React, { useState, useEffect } from 'react';

const placeholderSuggestions = [
  "Write a marketing strategy for a coffee brand...",
  "Create a compelling story about a boy and dragon...",
  "Develop a business plan for a tech startup...",
  "Design a user onboarding flow for an app...",
  "Write a product description for smart headphones...",
  "Create a social media campaign for eco-friendly products...",
  "Draft an email to investors about funding...",
  "Write a blog post about AI in healthcare...",
  "Create a training program for remote teams...",
  "Design a customer retention strategy..."
];

interface AnimatedPlaceholderProps {
  className?: string;
}

const AnimatedPlaceholder: React.FC<AnimatedPlaceholderProps> = ({ className }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentSuggestion = placeholderSuggestions[currentIndex];
    
    const timer = setTimeout(() => {
      if (isTyping) {
        if (charIndex < currentSuggestion.length) {
          setCurrentText(currentSuggestion.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Pause at the end before backspacing
          setTimeout(() => setIsTyping(false), 2000);
        }
      } else {
        if (charIndex > 0) {
          setCurrentText(currentSuggestion.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          // Move to next suggestion
          setCurrentIndex((currentIndex + 1) % placeholderSuggestions.length);
          setIsTyping(true);
        }
      }
    }, isTyping ? 50 : 30); // Typing speed vs backspacing speed

    return () => clearTimeout(timer);
  }, [currentText, currentIndex, isTyping, charIndex]);

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default AnimatedPlaceholder;