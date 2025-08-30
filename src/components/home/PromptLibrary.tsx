import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Copy, ExternalLink, Clock, User, Tag, MessageSquare, Image, Video, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

type ContentType = 'text' | 'image' | 'video';

interface PromptCard {
  id: string;
  type: ContentType;
  title: string;
  prompt: string;
  content: {
    preview: string;
    fullContent?: string;
  };
  metadata: {
    author: string;
    timestamp: string;
    likes: number;
    tags: string[];
  };
  isLiked?: boolean;
}

// Mock data for demonstration
const mockPrompts: PromptCard[] = [
  {
    id: '1',
    type: 'text',
    title: 'Creative Writing Assistant',
    prompt: 'Write a compelling short story about a time traveler who discovers that changing the past creates parallel universes instead of altering the current timeline.',
    content: {
      preview: 'Sarah stepped through the temporal gateway, her heart racing with anticipation. The year was 1955, and she had one mission: prevent the accident that claimed her grandfather\'s life. But as she watched the events unfold...'
    },
    metadata: {
      author: 'storyteller_jane',
      timestamp: '2 hours ago',
      likes: 24,
      tags: ['creative-writing', 'sci-fi', 'time-travel']
    }
  },
  {
    id: '2',
    type: 'image',
    title: 'Cyberpunk Portrait',
    prompt: 'A highly detailed cyberpunk portrait of a female hacker with neon blue hair, wearing AR glasses, surrounded by holographic code displays, dark urban background with neon lights, photorealistic, 8K resolution',
    content: {
      preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
    },
    metadata: {
      author: 'digital_artist',
      timestamp: '4 hours ago',
      likes: 156,
      tags: ['cyberpunk', 'portrait', 'neon', 'futuristic']
    }
  },
  {
    id: '3',
    type: 'video',
    title: 'Product Demo Animation',
    prompt: 'Create a smooth 30-second product demonstration video showing a sleek smartphone rotating 360 degrees with feature callouts appearing as floating text, modern minimalist background, professional lighting',
    content: {
      preview: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop'
    },
    metadata: {
      author: 'motion_pro',
      timestamp: '6 hours ago',
      likes: 89,
      tags: ['product-demo', 'animation', 'commercial']
    }
  },
  {
    id: '4',
    type: 'text',
    title: 'Email Marketing Copy',
    prompt: 'Write a persuasive email marketing campaign for a sustainable fashion brand launching their new eco-friendly collection. Focus on environmental impact, quality, and style. Include subject line and call-to-action.',
    content: {
      preview: 'Subject: 🌱 Fashion That Cares: Introducing Our Earth-Friendly Collection\n\nDear Conscious Consumer,\n\nImagine wearing clothes that not only make you look amazing but also help heal our planet...'
    },
    metadata: {
      author: 'marketing_maven',
      timestamp: '8 hours ago',
      likes: 67,
      tags: ['marketing', 'email', 'sustainability', 'fashion']
    }
  },
  {
    id: '5',
    type: 'image',
    title: 'Abstract Art Piece',
    prompt: 'Generate an abstract digital art piece featuring flowing organic shapes in vibrant gradients of purple, teal, and gold, with subtle particle effects and depth of field, suitable for modern interior design',
    content: {
      preview: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop'
    },
    metadata: {
      author: 'abstract_creator',
      timestamp: '12 hours ago',
      likes: 203,
      tags: ['abstract', 'digital-art', 'gradients', 'modern']
    }
  },
  {
    id: '6',
    type: 'text',
    title: 'Technical Documentation',
    prompt: 'Create comprehensive API documentation for a REST endpoint that handles user authentication, including request/response examples, error codes, rate limiting, and security considerations.',
    content: {
      preview: '# User Authentication API\n\n## POST /api/auth/login\n\nAuthenticates a user and returns an access token.\n\n### Request Body\n```json\n{\n  "email": "user@example.com",\n  "password": "securePassword123"\n}\n```'
    },
    metadata: {
      author: 'dev_docs_pro',
      timestamp: '1 day ago',
      likes: 45,
      tags: ['documentation', 'api', 'technical', 'authentication']
    }
  }
];

const PromptLibrary: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptCard[]>(mockPrompts);
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const typeIcons = {
    text: MessageSquare,
    image: Image,
    video: Video
  };

  const typeColors = {
    text: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    image: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    video: 'text-violet-500 bg-violet-500/10 border-violet-500/20'
  };

  const filteredPrompts = filter === 'all' 
    ? prompts 
    : prompts.filter(prompt => prompt.type === filter);

  const handleCopyPrompt = async (prompt: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  const handleLike = (id: string) => {
    setPrompts(prev => prev.map(prompt => 
      prompt.id === id 
        ? { 
            ...prompt, 
            isLiked: !prompt.isLiked,
            metadata: {
              ...prompt.metadata,
              likes: prompt.isLiked 
                ? prompt.metadata.likes - 1 
                : prompt.metadata.likes + 1
            }
          }
        : prompt
    ));
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background-primary">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary-500" />
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              Prompt Library
            </h2>
            <span className="px-2 py-1 bg-primary-500/20 text-primary-500 text-xs font-medium rounded-full border border-primary-500/30">
              BETA
            </span>
          </div>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Discover and share amazing prompts created by our community
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 mb-12"
        >
          {['all', 'text', 'image', 'video'].map((type) => {
            const isActive = filter === type;
            const Icon = type !== 'all' ? typeIcons[type as ContentType] : null;
            
            return (
              <button
                key={type}
                onClick={() => setFilter(type as ContentType | 'all')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
                  "border backdrop-blur-sm capitalize",
                  isActive
                    ? "bg-primary-500/20 border-primary-500/30 text-primary-500"
                    : "bg-background-dark/30 border-border-primary/20 text-text-secondary hover:bg-background-dark/50"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="text-sm font-medium">{type}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Prompt Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPrompts.map((prompt, index) => {
            const TypeIcon = typeIcons[prompt.type];
            
            return (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-xl border border-border-primary/20 overflow-hidden hover:border-primary-500/30 transition-all duration-300 group"
              >
                {/* Content Preview */}
                <div className="relative h-48 bg-background-dark/30">
                  {prompt.type === 'image' ? (
                    <img
                      src={prompt.content.preview}
                      alt={prompt.title}
                      className="w-full h-full object-cover"
                    />
                  ) : prompt.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <img
                        src={prompt.content.preview}
                        alt={prompt.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                          <Video className="h-6 w-6 text-gray-800" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 h-full flex items-center">
                      <p className="text-text-primary text-sm leading-relaxed line-clamp-6">
                        {prompt.content.preview}
                      </p>
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className={cn(
                    "absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
                    typeColors[prompt.type]
                  )}>
                    <TypeIcon className="h-3 w-3" />
                    <span className="capitalize">{prompt.type}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-text-primary mb-3 group-hover:text-primary-500 transition-colors">
                    {prompt.title}
                  </h3>

                  {/* Prompt */}
                  <div className="mb-4">
                    <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
                      {prompt.prompt}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {prompt.metadata.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-background-dark/50 text-text-secondary text-xs rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-text-secondary mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{prompt.metadata.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{prompt.metadata.timestamp}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(prompt.id)}
                        className={cn(
                          "flex items-center gap-1 text-xs transition-colors",
                          prompt.isLiked ? "text-red-500" : "text-text-secondary hover:text-red-500"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", prompt.isLiked && "fill-current")} />
                        <span>{prompt.metadata.likes}</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyPrompt(prompt.prompt, prompt.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-primary-500/20 text-primary-500 text-xs rounded-md hover:bg-primary-500/30 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copiedId === prompt.id ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Load More */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button className="px-6 py-3 bg-primary-500/20 text-primary-500 rounded-lg hover:bg-primary-500/30 transition-colors border border-primary-500/30">
            Load More Prompts
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default PromptLibrary;