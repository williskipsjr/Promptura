import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  GitBranch, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  ArrowRight, 
  FileText, 
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Copy,
  RotateCcw
} from 'lucide-react';
import { PromptVersioningService } from '../../services/promptVersioningService';
import type { PromptVersion, VersionHistory, SavedPrompt } from '../../lib/supabase';
import { supabaseUtils } from '../../lib/supabase';

interface PromptVersioningProps {
  prompt: SavedPrompt;
  onVersionChange?: (version: PromptVersion) => void;
  onClose?: () => void;
}

export const PromptVersioning: React.FC<PromptVersioningProps> = ({
  prompt,
  onVersionChange,
  onClose
}) => {
  const [versionHistory, setVersionHistory] = useState<VersionHistory | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New version form state
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [newVersionContent, setNewVersionContent] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadVersionHistory();
  }, [prompt.id]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      const history = await PromptVersioningService.getVersionHistory(prompt.id);
      setVersionHistory(history);
    } catch (err) {
      setError('Failed to load version history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersionTitle.trim() || !newVersionContent.trim()) return;

    try {
      setCreating(true);
      const newVersion = await PromptVersioningService.createVersion(
        prompt.id,
        newVersionTitle,
        newVersionContent,
        newVersionDescription || undefined
      );
      
      await loadVersionHistory();
      setShowCreateVersion(false);
      setNewVersionTitle('');
      setNewVersionContent('');
      setNewVersionDescription('');
      
      if (onVersionChange) {
        onVersionChange(newVersion);
      }
    } catch (err) {
      setError('Failed to create version');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleSetCurrentVersion = async (versionId: string) => {
    try {
      await PromptVersioningService.setCurrentVersion(versionId);
      await loadVersionHistory();
      
      const version = versionHistory?.versions.find(v => v.id === versionId);
      if (version && onVersionChange) {
        onVersionChange(version);
      }
    } catch (err) {
      setError('Failed to set current version');
      console.error(err);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version?')) return;
    
    try {
      await PromptVersioningService.deleteVersion(versionId);
      await loadVersionHistory();
    } catch (err) {
      setError('Failed to delete version');
      console.error(err);
    }
  };

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId];
      }
    });
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      setShowComparison(true);
    }
  };

  const handleBranchFromVersion = async (versionId: string) => {
    const version = versionHistory?.versions.find(v => v.id === versionId);
    if (!version) return;

    setNewVersionTitle(`${version.title} (Branch)`);
    setNewVersionContent(version.content);
    setNewVersionDescription(`Branched from version ${version.version_number}`);
    setShowCreateVersion(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitBranch className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Version History: {prompt.title}
              </h2>
              <p className="text-sm text-gray-500">
                {versionHistory?.total_versions} versions • Current: v{versionHistory?.current_version?.version_number}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {selectedVersions.length === 2 && (
              <button
                onClick={handleCompareVersions}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Compare</span>
              </button>
            )}
            <button
              onClick={() => setShowCreateVersion(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Version</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Version List */}
      <div className="p-6">
        <div className="space-y-4">
          {versionHistory?.versions.map((version, index) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                version.is_current ? 'border-green-300 bg-green-50' : 'border-gray-200'
              } ${
                selectedVersions.includes(version.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(version.id)}
                    onChange={() => handleVersionSelect(version.id)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                    disabled={selectedVersions.length >= 2 && !selectedVersions.includes(version.id)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        v{version.version_number}
                      </span>
                      {version.is_current && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Current</span>
                        </span>
                      )}
                      <h3 className="font-medium text-gray-900">{version.title}</h3>
                    </div>
                    
                    {version.change_description && (
                      <p className="text-sm text-gray-600 mb-2">{version.change_description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{supabaseUtils.formatRelativeTime(version.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{version.content.length} characters</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm font-mono text-gray-700 max-h-20 overflow-hidden">
                      {version.content.substring(0, 150)}
                      {version.content.length > 150 && '...'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!version.is_current && (
                    <button
                      onClick={() => handleSetCurrentVersion(version.id)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Set as current"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleBranchFromVersion(version.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Branch from this version"
                  >
                    <GitBranch className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => navigator.clipboard.writeText(version.content)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy content"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  
                  {!version.is_current && versionHistory.total_versions > 1 && (
                    <button
                      onClick={() => handleDeleteVersion(version.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete version"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create New Version Modal */}
      <AnimatePresence>
        {showCreateVersion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Create New Version</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version Title
                  </label>
                  <input
                    type="text"
                    value={newVersionTitle}
                    onChange={(e) => setNewVersionTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter version title..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newVersionDescription}
                    onChange={(e) => setNewVersionDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what changed in this version..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt Content
                  </label>
                  <textarea
                    value={newVersionContent}
                    onChange={(e) => setNewVersionContent(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter the prompt content..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateVersion(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVersion}
                  disabled={!newVersionTitle.trim() || !newVersionContent.trim() || creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {creating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>{creating ? 'Creating...' : 'Create Version'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version Comparison Modal */}
      <AnimatePresence>
        {showComparison && selectedVersions.length === 2 && (
          <VersionComparisonModal
            versionAId={selectedVersions[0]}
            versionBId={selectedVersions[1]}
            onClose={() => setShowComparison(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Version Comparison Modal Component
interface VersionComparisonModalProps {
  versionAId: string;
  versionBId: string;
  onClose: () => void;
}

const VersionComparisonModal: React.FC<VersionComparisonModalProps> = ({
  versionAId,
  versionBId,
  onClose
}) => {
  const [versionA, setVersionA] = useState<PromptVersion | null>(null);
  const [versionB, setVersionB] = useState<PromptVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [diff, setDiff] = useState<any[]>([]);

  useEffect(() => {
    loadVersions();
  }, [versionAId, versionBId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const [vA, vB] = await Promise.all([
        PromptVersioningService.getVersion(versionAId),
        PromptVersioningService.getVersion(versionBId)
      ]);
      
      setVersionA(vA);
      setVersionB(vB);
      
      const differences = PromptVersioningService.getVersionDiff(vA, vB);
      setDiff(differences);
    } catch (err) {
      console.error('Error loading versions for comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Version Comparison</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <span>v{versionA?.version_number} ({versionA?.title})</span>
            <ArrowRight className="h-4 w-4" />
            <span>v{versionB?.version_number} ({versionB?.title})</span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Version {versionA?.version_number}</h4>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                {versionA?.content}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Version {versionB?.version_number}</h4>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                {versionB?.content}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Differences</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {diff.map((change, index) => (
                <div
                  key={index}
                  className={`font-mono text-sm py-1 ${
                    change.type === 'added' ? 'bg-green-100 text-green-800' :
                    change.type === 'removed' ? 'bg-red-100 text-red-800' :
                    'text-gray-600'
                  }`}
                >
                  <span className="inline-block w-8 text-xs text-gray-400">
                    {change.lineNumber}
                  </span>
                  <span className="inline-block w-4">
                    {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : ' '}
                  </span>
                  {change.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};