import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, Download, Heart, Eye, Copy, Share2, Bookmark, 
  Zap, Clock, User, MessageCircle, Award, TrendingUp 
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { MarketplacePrompt } from '../../lib/supabase';

interface PromptCardProps {
  prompt: MarketplacePrompt;
  index: number;
  viewMode: 'grid' | 'list';
  isLiked: boolean;
  isCopied: boolean;
  isDownloading: boolean;
  isFollowing: boolean;
  onLike: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onShare: () => void;
  onFollow: () => void;
  onClick: () => void;
  currentUser?: any;
}

const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  index,
  viewMode,
  isLiked,
  isCopied,
  isDownloading,
  isFollowing,
  onLike,
  onCopy,
  onDownload,
  onShare,
  onFollow,
  onClick,
  currentUser
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return 'text-success-500';
    if (score >= 80) return 'text-primary-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-neutral-400';
  };

  const getPerformanceLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    return 'Fair';
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        className="glass rounded-xl p-6 hover:scale-102 transition-all duration-300 cursor-pointer group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={onClick}
      >
        <div className="flex items-center gap-6">
          {/* Author Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center text-xl flex-shrink-0 relative">
            {prompt.author_avatar}
            {prompt.is_featured && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <Award className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-text-primary line-clamp-1">{prompt.title}</h3>
                  <div className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1", getPerformanceColor(prompt.performance_score))}>
                    <Zap className="h-3 w-3" />
                    {prompt.performance_score}%
                  </div>
                </div>
                <p className="text-sm text-text-secondary line-clamp-2 mb-2">{prompt.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {prompt.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    {prompt.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {formatNumber(prompt.downloads)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {formatNumber(prompt.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatNumber(prompt.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(prompt.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {/* Tags */}
              <div className="flex items-center gap-1 ml-4">
                {prompt.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
                {prompt.tags.length > 2 && (
                  <span className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded-full">
                    +{prompt.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {currentUser && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isLiked ? "bg-error-500/20 text-error-500" : "hover:bg-white/5"
                )}
                title="Like"
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isCopied ? "bg-success-500/20 text-success-500" : "hover:bg-white/5"
              )}
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDownloading ? "bg-success-500/20 text-success-500" : "hover:bg-white/5"
              )}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      className="glass rounded-xl p-6 hover:scale-105 transition-all duration-300 relative overflow-hidden cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
    >
      {/* Featured Badge */}
      {prompt.is_featured && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Award className="h-3 w-3" />
            Featured
          </div>
        </div>
      )}

      {/* Performance Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={cn(
          "text-xs px-2 py-1 rounded-full flex items-center gap-1",
          prompt.performance_score >= 90 ? "bg-success-500/20 text-success-500" :
          prompt.performance_score >= 80 ? "bg-primary-500/20 text-primary-400" :
          prompt.performance_score >= 70 ? "bg-yellow-500/20 text-yellow-500" :
          "bg-neutral-500/20 text-neutral-400"
        )}>
          <Zap className="h-3 w-3" />
          {prompt.performance_score}%
        </div>
      </div>

      {/* Author Section */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-lg">
          {prompt.author_avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-text-primary truncate">{prompt.author}</h4>
            {currentUser && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFollow();
                }}
                className={cn(
                  "text-xs px-2 py-1 rounded-full transition-colors",
                  isFollowing
                    ? "bg-primary-500 text-white"
                    : "bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          <p className="text-xs text-text-secondary">{new Date(prompt.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="font-display font-bold text-text-primary mb-2 line-clamp-2">{prompt.title}</h3>
        <p className="text-sm text-text-secondary mb-3 line-clamp-3">{prompt.description}</p>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-neutral-400 mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span>{prompt.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span>{formatNumber(prompt.downloads)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{formatNumber(prompt.likes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{formatNumber(prompt.views)}</span>
          </div>
        </div>

        {/* Category */}
        <div className="mb-3">
          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
            {prompt.category}
          </span>
        </div>
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {prompt.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 bg-accent-500/20 text-accent-400 rounded-full"
          >
            #{tag}
          </span>
        ))}
        {prompt.tags.length > 3 && (
          <span className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded-full">
            +{prompt.tags.length - 3}
          </span>
        )}
      </div>
      
      {/* Use Cases Preview */}
      <div className="mb-4">
        <p className="text-xs text-neutral-400 mb-1">Perfect for:</p>
        <ul className="text-xs text-text-secondary">
          {prompt.use_cases.slice(0, 2).map((useCase, index) => (
            <li key={index} className="line-clamp-1">• {useCase}</li>
          ))}
        </ul>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentUser && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                isLiked
                  ? "bg-error-500/20 text-error-500"
                  : "bg-background-dark hover:bg-background-light text-neutral-300"
              )}
            >
              <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
              {formatNumber(prompt.likes)}
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-background-dark hover:bg-background-light text-neutral-300 transition-colors"
          >
            <Share2 className="h-3 w-3" />
            Share
          </button>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-lg transition-colors text-xs",
              isCopied
                ? "bg-success-500/20 text-success-500"
                : "bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
            )}
          >
            <Copy className="h-3 w-3" />
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-lg transition-colors text-xs",
              isDownloading
                ? "bg-success-500/20 text-success-500"
                : "bg-background-dark hover:bg-background-light text-neutral-300"
            )}
          >
            <Download className="h-3 w-3" />
            {isDownloading ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
};

export default PromptCard;