import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BoltLogo from '../components/BoltLogo';
import { motion } from 'framer-motion';

const MainLayout: React.FC = () => {
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