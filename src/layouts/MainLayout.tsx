import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BoltLogo from '../components/BoltLogo';
import { motion } from 'framer-motion';

const MainLayout: React.FC = () => {
  const [isScrolling, setIsScrolling] = useState(false);

  // Global mouse tracking for glow effect
  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;
      
      // Set global CSS variables for mouse position
      document.documentElement.style.setProperty('--global-x', x.toFixed(2));
      document.documentElement.style.setProperty('--global-y', y.toFixed(2));
      document.documentElement.style.setProperty('--global-xp', (x / window.innerWidth).toFixed(2));
      document.documentElement.style.setProperty('--global-yp', (y / window.innerHeight).toFixed(2));
    };

    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  // Scroll performance optimization
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;

    const handleScroll = () => {
      if (!isScrolling) {
        setIsScrolling(true);
        isScrolling = true;
      }
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set new timeout to detect when scrolling stops
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        isScrolling = false;
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  // Apply/remove scrolling class to body
  useEffect(() => {
    if (isScrolling) {
      document.body.classList.add('is-scrolling');
    } else {
      document.body.classList.remove('is-scrolling');
    }
    
    return () => {
      document.body.classList.remove('is-scrolling');
    };
  }, [isScrolling]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <motion.main 
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.main>
      <Footer />
      <BoltLogo />
    </div>
  );
};

export default MainLayout;