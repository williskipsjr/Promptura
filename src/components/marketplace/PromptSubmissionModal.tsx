import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, Tag, Globe, Lock, AlertCircle, Check, Zap, 
  Eye, Target, Lightbulb, Award, Users, TrendingUp 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MarketplaceService } from '../../services/marketplace';
import { cn } from '../../utils/cn';

interface PromptSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  'Marketing', 'Content Creation', 'Code Generation', 'Analysis', 
  'Creative Writing', 'Business', 'Education', 'Research', 'Social Media',
  'Email', 'Product', 'Strategy', 'Design', 'Data Science', 'Customer Service',
  'Sales', 'HR', 'Legal', 'Finance', 'Healthcare', 'E-commerce', 'Gaming',
  'Travel', 'Food & Beverage', 'Real Estate', 'Non-profit', 'Entertainment'
];

const popularTags = [
  'conversion', 'engagement', 'automation', 'personalization', 'analytics',
  'optimization', 'creative', 'professional', 'beginner-friendly', 'advanced',
  'templates', 'frameworks', 'best-practices', 'trending', 'viral', 'ai-powered',
  'productivity', 'marketing', 'sales', 'content', 'social-media', 'email',
  'copywriting', 'seo', 'branding', 'strategy'
];

const PromptSubmissionModal: React.FC<PromptSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt_text: '',
    category: '',
    tags: [] as string[],
    use_cases: [] as string[],
    is_public: true
  });
  const [currentTag, setCurrentTag] = useState('');
  const [currentUseCase, setCurrentUseCase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Real-time validation
  const validateField = (field: string, value: any) => {
    const errors: { [key: string]: string } = {};

    switch (field) {
      case 'title':
        if (!value.trim()) errors.title = 'Title is required';
        else if (value.length < 5) errors.title = 'Title must be at least 5 characters';
        else if (value.length > 100) errors.title = 'Title must be less than 100 characters';
        break;
      case 'description':
        if (!value.trim()) errors.description = 'Description is required';
        else if (value.length < 20) errors.description = 'Description must be at least 20 characters';
        else if (value.length > 500) errors.description = 'Description must be less than 500 characters';
        break;
      case 'prompt_text':
        if (!value.trim()) errors.prompt_text = 'Prompt text is required';
        else if (value.length < 50) errors.prompt_text = 'Prompt must be at least 50 characters';
        else if (value.length > 5000) errors.prompt_text = 'Prompt must be less than 5000 characters';
        break;
      case 'category':
        if (!value) errors.category = 'Please select a category';
        break;
      case 'tags':
        if (value.length === 0) errors.tags = 'Please add at least one tag';
        else if (value.length > 10) errors.tags = 'Maximum 10 tags allowed';
        break;
      case 'use_cases':
        if (value.length === 0) errors.use_cases = 'Please add at least one use case';
        else if (value.length > 10) errors.use_cases = 'Maximum 10 use cases allowed';
        break;
    }

    setValidationErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const calculateQualityScore = () => {
    let score = 0;
    
    // Title quality (0-20 points)
    if (formData.title.length >= 10 && formData.title.length <= 60) score += 15;
    if (formData.title.split(' ').length >= 2) score += 5;
    
    // Description quality (0-20 points)
    if (formData.description.length >= 50 && formData.description.length <= 300) score += 15;
    if (formData.description.includes('help') || formData.description.includes('use')) score += 5;
    
    // Prompt quality (0-30 points)
    if (formData.prompt_text.length >= 100) score += 10;
    if (formData.prompt_text.includes('Act as') || formData.prompt_text.includes('You are')) score += 10;
    if (formData.prompt_text.includes('Context:') || formData.prompt_text.includes('Task:')) score += 10;
    
    // Metadata quality (0-30 points)
    if (formData.tags.length >= 3) score += 10;
    if (formData.use_cases.length >= 2) score += 10;
    if (formData.category) score += 10;
    
    return Math.min(100, score);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate all fields
    const isValid = Object.keys(formData).every(field => 
      validateField(field, formData[field as keyof typeof formData])
    );

    if (!isValid) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await MarketplaceService.submitPrompt(
        formData,
        currentUser.id,
        currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Anonymous'
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          resetForm();
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit prompt');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      prompt_text: '',
      category: '',
      tags: [],
      use_cases: [],
      is_public: true
    });
    setCurrentTag('');
    setCurrentUseCase('');
    setError('');
    setSuccess(false);
    setStep(1);
    setValidationErrors({});
  };

  const addTag = (tag?: string) => {
    const tagToAdd = tag || currentTag.trim();
    if (tagToAdd && !formData.tags.includes(tagToAdd) && formData.tags.length < 10) {
      const newTags = [...formData.tags, tagToAdd];
      handleInputChange('tags', newTags);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = formData.tags.filter(tag => tag !== tagToRemove);
    handleInputChange('tags', newTags);
  };

  const addUseCase = () => {
    if (currentUseCase.trim() && !formData.use_cases.includes(currentUseCase.trim()) && formData.use_cases.length < 10) {
      const newUseCases = [...formData.use_cases, currentUseCase.trim()];
      handleInputChange('use_cases', newUseCases);
      setCurrentUseCase('');
    }
  };

  const removeUseCase = (useCaseToRemove: string) => {
    const newUseCases = formData.use_cases.filter(useCase => useCase !== useCaseToRemove);
    handleInputChange('use_cases', newUseCases);
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate basic info
      const basicValid = validateField('title', formData.title) && 
                        validateField('description', formData.description) && 
                        validateField('category', formData.category);
      if (basicValid) setStep(2);
    } else if (step === 2) {
      // Validate prompt text
      if (validateField('prompt_text', formData.prompt_text)) setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const qualityScore = calculateQualityScore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border-color">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Upload className="h-6 w-6 text-primary-500" />
                <div>
                  <h2 className="text-xl font-display font-bold text-text-primary">
                    Submit Prompt to Marketplace
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Share your prompt with the community and help others create better content
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-text-secondary">Step {step} of 3</span>
                <div className="flex-1 bg-neutral-800 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-text-secondary">{Math.round((step / 3) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Success State */}
          {success && (
            <div className="p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-success-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-success-500" />
                </div>
                <h3 className="text-2xl font-display font-bold text-text-primary mb-3">
                  🎉 Prompt Submitted Successfully!
                </h3>
                <p className="text-text-secondary mb-4">
                  Your prompt has been submitted to the marketplace and will be available shortly.
                </p>
                <div className="glass p-4 rounded-lg">
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary-500" />
                      <span>Quality Score: {qualityScore}/100</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-accent-500" />
                      <span>Ready for Community</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Steps */}
          {!success && (
            <form onSubmit={handleSubmit} className="p-6">
              {/* Error Message */}
              {error && (
                <div className="bg-error-500/10 border border-error-500/20 text-error-500 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Step 1: Basic Information */}
              {step === 1 && (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-display font-bold text-text-primary mb-2">
                      Basic Information
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Let's start with the basics about your prompt
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={cn(
                        "input-field",
                        validationErrors.title && "border-error-500 focus:ring-error-500"
                      )}
                      placeholder="Give your prompt a catchy, descriptive title..."
                      required
                    />
                    {validationErrors.title && (
                      <p className="text-error-500 text-xs mt-1">{validationErrors.title}</p>
                    )}
                    <p className="text-xs text-text-secondary mt-1">
                      {formData.title.length}/100 characters
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={cn(
                        "input-field min-h-[120px]",
                        validationErrors.description && "border-error-500 focus:ring-error-500"
                      )}
                      placeholder="Describe what your prompt does, who it's for, and why it's useful..."
                      required
                    />
                    {validationErrors.description && (
                      <p className="text-error-500 text-xs mt-1">{validationErrors.description}</p>
                    )}
                    <p className="text-xs text-text-secondary mt-1">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={cn(
                        "input-field",
                        validationErrors.category && "border-error-500 focus:ring-error-500"
                      )}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {validationErrors.category && (
                      <p className="text-error-500 text-xs mt-1">{validationErrors.category}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Prompt Content */}
              {step === 2 && (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-display font-bold text-text-primary mb-2">
                      Prompt Content
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Share your actual prompt text
                    </p>
                  </div>

                  {/* Prompt Text */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Prompt Text *
                    </label>
                    <textarea
                      value={formData.prompt_text}
                      onChange={(e) => handleInputChange('prompt_text', e.target.value)}
                      className={cn(
                        "input-field min-h-[300px] font-mono text-sm",
                        validationErrors.prompt_text && "border-error-500 focus:ring-error-500"
                      )}
                      placeholder="Paste your full prompt here. Include any instructions, context, or formatting that makes it effective..."
                      required
                    />
                    {validationErrors.prompt_text && (
                      <p className="text-error-500 text-xs mt-1">{validationErrors.prompt_text}</p>
                    )}
                    <div className="flex justify-between text-xs text-text-secondary mt-1">
                      <span>{formData.prompt_text.length}/5000 characters</span>
                      <span>~{Math.ceil(formData.prompt_text.length / 4)} tokens</span>
                    </div>
                  </div>

                  {/* Quality Indicators */}
                  <div className="glass p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Quality Tips
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className={cn(
                        "flex items-center gap-2",
                        formData.prompt_text.includes('Act as') || formData.prompt_text.includes('You are') 
                          ? "text-success-500" : "text-neutral-400"
                      )}>
                        <div className="w-2 h-2 rounded-full bg-current" />
                        Clear role definition
                      </div>
                      <div className={cn(
                        "flex items-center gap-2",
                        formData.prompt_text.includes('Context:') || formData.prompt_text.includes('Task:') 
                          ? "text-success-500" : "text-neutral-400"
                      )}>
                        <div className="w-2 h-2 rounded-full bg-current" />
                        Structured format
                      </div>
                      <div className={cn(
                        "flex items-center gap-2",
                        formData.prompt_text.length >= 100 ? "text-success-500" : "text-neutral-400"
                      )}>
                        <div className="w-2 h-2 rounded-full bg-current" />
                        Sufficient detail
                      </div>
                      <div className={cn(
                        "flex items-center gap-2",
                        formData.prompt_text.includes('example') || formData.prompt_text.includes('format') 
                          ? "text-success-500" : "text-neutral-400"
                      )}>
                        <div className="w-2 h-2 rounded-full bg-current" />
                        Examples included
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Metadata & Settings */}
              {step === 3 && (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-display font-bold text-text-primary mb-2">
                      Tags & Settings
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Help others discover your prompt
                    </p>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Tags * (1-10 tags)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Add a tag..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <button
                        type="button"
                        onClick={() => addTag()}
                        disabled={!currentTag.trim() || formData.tags.length >= 10}
                        className="btn btn-secondary"
                      >
                        <Tag className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Popular Tags */}
                    <div className="mb-3">
                      <p className="text-xs text-text-secondary mb-2">Popular tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {popularTags.slice(0, 12).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            disabled={formData.tags.includes(tag) || formData.tags.length >= 10}
                            className={cn(
                              "text-xs px-2 py-1 rounded-full transition-colors",
                              formData.tags.includes(tag)
                                ? "bg-primary-500/20 text-primary-400 cursor-not-allowed"
                                : "bg-accent-500/20 text-accent-400 hover:bg-accent-500/30"
                            )}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Tags */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full flex items-center gap-1"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-error-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    {validationErrors.tags && (
                      <p className="text-error-500 text-xs">{validationErrors.tags}</p>
                    )}
                  </div>

                  {/* Use Cases */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Use Cases * (1-10 use cases)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={currentUseCase}
                        onChange={(e) => setCurrentUseCase(e.target.value)}
                        className="input-field flex-1"
                        placeholder="e.g., Email marketing campaigns"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUseCase())}
                      />
                      <button
                        type="button"
                        onClick={addUseCase}
                        disabled={!currentUseCase.trim() || formData.use_cases.length >= 10}
                        className="btn btn-secondary"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2 mb-2">
                      {formData.use_cases.map((useCase) => (
                        <div
                          key={useCase}
                          className="flex items-center justify-between p-3 bg-background-light rounded-lg"
                        >
                          <span className="text-sm text-text-primary flex items-center gap-2">
                            <Target className="h-3 w-3 text-primary-500" />
                            {useCase}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeUseCase(useCase)}
                            className="text-error-500 hover:text-error-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {validationErrors.use_cases && (
                      <p className="text-error-500 text-xs">{validationErrors.use_cases}</p>
                    )}
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                      Visibility
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleInputChange('is_public', true)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                          formData.is_public
                            ? "border-primary-500 bg-primary-500/10"
                            : "border-border-color hover:border-primary-400/30"
                        )}
                      >
                        <Globe className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-medium">Public</p>
                          <p className="text-xs text-text-secondary">Visible to everyone in the marketplace</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('is_public', false)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                          !formData.is_public
                            ? "border-primary-500 bg-primary-500/10"
                            : "border-border-color hover:border-primary-400/30"
                        )}
                      >
                        <Lock className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-medium">Private</p>
                          <p className="text-xs text-text-secondary">Only visible to you</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Quality Score Preview */}
                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary-500" />
                        Quality Score Preview
                      </h4>
                      <span className="text-lg font-bold text-primary-500">{qualityScore}/100</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2 mb-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${qualityScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary">
                      {qualityScore >= 80 ? 'Excellent! Your prompt is ready for the marketplace.' :
                       qualityScore >= 60 ? 'Good quality. Consider adding more details for better performance.' :
                       'Consider improving your prompt with more structure and examples.'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-6 border-t border-border-color">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary flex-1"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || Object.keys(validationErrors).length > 0}
                    className={cn(
                      "btn btn-primary flex-1",
                      (loading || Object.keys(validationErrors).length > 0) && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </div>
                    ) : (
                      'Submit Prompt'
                    )}
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PromptSubmissionModal;