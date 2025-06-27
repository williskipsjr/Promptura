import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  History, 
  Star, 
  Settings, 
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapseChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  // Notify parent when collapse state changes
  useEffect(() => {
    onCollapseChange?.(!isExpanded);
  }, [isExpanded, onCollapseChange]);

  const navItems = [
    { icon: History, label: 'History', path: '/dashboard/history' },
    { icon: Star, label: 'Saved Prompts', path: '/dashboard/saved' },
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const getUserDisplayName = () => {
    return currentUser?.user_metadata?.full_name || 
           currentUser?.email?.split('@')[0] || 
           'User';
  };

  return (
    <motion.div
      className={cn(
        "fixed top-0 left-0 h-screen bg-background-dark/95 backdrop-blur-xl border-r border-border-color transition-all duration-300 z-40 flex flex-col",
        isExpanded ? "w-64" : "w-20"
      )}
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center transform -translate-y-1/2 hover:bg-primary-600 transition-colors shadow-lg z-50"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronRight 
          className={cn(
            "h-4 w-4 text-white transition-transform duration-300",
            !isExpanded && "rotate-180"
          )} 
        />
      </button>

      {/* Header Spacing */}
      <div className="h-24 flex-shrink-0" />

      {/* User Profile Section */}
      <div className={cn(
        "px-4 mb-6 flex-shrink-0",
        !isExpanded && "px-2"
      )}>
        <div className={cn(
          "glass rounded-xl transition-all duration-300",
          isExpanded ? "p-4" : "p-3"
        )}>
          <div className={cn(
            "flex items-center transition-all duration-300",
            isExpanded ? "gap-3" : "justify-center"
          )}>
            {/* Avatar */}
            <div className={cn(
              "rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 transition-all duration-300",
              isExpanded ? "w-10 h-10" : "w-8 h-8"
            )}>
              <User className={cn(
                "text-primary-500 transition-all duration-300",
                isExpanded ? "h-5 w-5" : "h-4 w-4"
              )} />
            </div>
            
            {/* User Info - Only show when expanded */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="overflow-hidden min-w-0 flex-1"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="font-medium truncate text-text-primary text-sm">
                    {getUserDisplayName()}
                  </p>
                  {currentUser?.email && (
                    <p className="text-xs text-text-secondary truncate">
                      {currentUser.email}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center rounded-lg mb-1 transition-all duration-200 group relative",
                isExpanded ? "gap-3 px-3 py-3" : "justify-center px-3 py-3",
                isActive 
                  ? "bg-primary-500/20 text-primary-500" 
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              )}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    className="font-medium truncate"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-background-dark border border-border-color rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className={cn(
        "p-4 mt-auto flex-shrink-0",
        !isExpanded && "p-2"
      )}>
        <button
          onClick={logout}
          className={cn(
            "w-full glass rounded-lg text-error-500 hover:text-error-400 hover:bg-error-500/10 transition-all duration-200 flex items-center group relative",
            isExpanded ? "gap-3 p-3" : "justify-center p-3"
          )}
          title={!isExpanded ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                className="font-medium"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>

          {/* Tooltip for collapsed state */}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-background-dark border border-border-color rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;