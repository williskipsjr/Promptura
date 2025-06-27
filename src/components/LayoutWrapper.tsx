import React, { useState } from 'react';
import { cn } from '../utils/cn';
import Sidebar from './dashboard/Sidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children, className }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background-dark">
      <Sidebar onCollapseChange={setSidebarCollapsed} />
      
      {/* Main content area with proper spacing */}
      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-screen",
        sidebarCollapsed ? "ml-20" : "ml-64"
      )}>
        {/* Content wrapper that respects footer */}
        <div className={cn(
          "flex-1 flex flex-col",
          className
        )}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default LayoutWrapper;