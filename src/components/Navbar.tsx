import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Sparkles, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/AuthContext';
import { NavBar } from './ui/tubelight-navbar';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <motion.header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'py-3 glass' : 'py-4 bg-transparent'
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo - Moved to far left with better spacing */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <Sparkles className="text-pink-500 h-6 w-6 md:h-7 md:w-7" />
          <span className="font-display text-lg md:text-xl font-bold gradient-text whitespace-nowrap">Promptura</span>
        </Link>

        {/* Desktop Navigation with Tubelight Effect - Centered */}
        <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-8">
          <NavBar />
        </div>

        {/* User Section - Right aligned with better spacing */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary truncate max-w-32">
                {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
              </span>
              <button 
                onClick={handleLogout}
                className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium transition-colors hover:text-primary-400 text-text-secondary whitespace-nowrap">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary whitespace-nowrap">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-text-primary z-50 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Menu */}
        <motion.div
          className={cn(
            "fixed inset-0 bg-background-dark/95 backdrop-blur-lg md:hidden",
            mobileMenuOpen ? "block" : "hidden"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: mobileMenuOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
            <Link 
              to="/" 
              className="text-2xl font-display font-medium hover:text-primary-400 transition-colors text-text-primary"
            >
              Home
            </Link>
            {/* <Link 
              to="/marketplace" 
              className="text-2xl font-display font-medium hover:text-primary-400 transition-colors text-text-primary"
            >
              Marketplace
            </Link> */}
            <Link 
              to="/ab-testing" 
              className="text-2xl font-display font-medium hover:text-primary-400 transition-colors text-text-primary"
            >
              A/B Testing
            </Link>
            <Link 
              to="/compare" 
              className="text-2xl font-display font-medium hover:text-primary-400 transition-colors text-text-primary"
            >
              Compare Models
            </Link>
            {currentUser && (
              <Link 
                to="/dashboard" 
                className="text-2xl font-display font-medium hover:text-primary-400 transition-colors text-text-primary"
              >
                Dashboard
              </Link>
            )}
            <div className="flex flex-col gap-4 mt-8 w-full max-w-xs">
              {currentUser ? (
                <>
                  <span className="text-center text-text-secondary text-sm">
                    {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="btn btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary w-full">
                    Login
                  </Link>
                  <Link to="/signup" className="btn btn-primary w-full">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Navbar;