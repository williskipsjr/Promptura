"use client"
import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { DivideIcon as LucideIcon, Home, Globe, Target, BarChart3, LayoutDashboard, BookOpen, Sparkles } from "lucide-react"
import { cn } from "../../utils/cn"
import { useAuth } from "../../contexts/AuthContext"
interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}
export function NavBar() {
  const location = useLocation();
  const { currentUser } = useAuth();

  const navItems: NavItem[] = [
    { name: 'Home', url: '/', icon: Home },
    // { name: 'Marketplace', url: '/marketplace', icon: Globe }, // Commented out for now
  
    { name: 'Prompt Library', url: '/prompt-library', icon: BookOpen },
    { name: 'A/B Testing', url: '/ab-testing', icon: Target },
    { name: 'Compare Models', url: '/compare', icon: BarChart3 },
    ...(currentUser ? [{ name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard }] : []),
  ];
  const getActiveTab = (pathname: string) => {
    if (pathname === '/') return 'Home';
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    // if (pathname === '/marketplace') return 'Marketplace'; // Commented out
  
    if (pathname === '/prompt-library') return 'Prompt Library';
    if (pathname === '/ab-testing') return 'A/B Testing';
    if (pathname === '/compare') return 'Compare Models';
    const activeItem = navItems.find(item => item.url === pathname);
    return activeItem ? activeItem.name : 'Home';
  };
  const activeTab = getActiveTab(location.pathname);
  return (
    <div className="relative flex items-center gap-3 bg-background-dark/5 border border-border-color backdrop-blur-lg py-1 px-1 rounded-full shadow-lg hidden md:flex">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.name
        return (
          <Link
            key={item.name}
            to={item.url}
            className={cn(
              "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
              "text-text-primary hover:text-primary-400",
              isActive && "bg-primary-500/20 text-primary-400",
            )}
          >
            <span>{item.name}</span>
            {isActive && (
              <motion.div
                layoutId="lamp"
                className="absolute inset-0 w-full bg-primary-500/5 rounded-full -z-10"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-t-full">
                  <div className="absolute w-12 h-6 bg-primary-500/20 rounded-full blur-md -top-2 -left-2" />
                  <div className="absolute w-8 h-6 bg-primary-500/20 rounded-full blur-md -top-1" />
                  <div className="absolute w-4 h-4 bg-primary-500/20 rounded-full blur-sm top-0 left-2" />
                </div>
              </motion.div>
            )}
          </Link>
        )
      })}
    </div>
  )
}