import { supabase } from '../lib/supabase';
import type { PromptVersion, PromptComparison, VersionHistory, SavedPrompt } from '../lib/supabase';

export class PromptVersioningService {
  /**
   * Get all versions for a specific prompt
   */
  static async getVersionHistory(promptId: string): Promise<VersionHistory> {
    try {
      const { data: versions, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      const currentVersion = versions?.find(v => v.is_current) || versions?.[0];
      const recentChanges = versions?.slice(0, 5) || [];

      return {
        versions: versions || [],
        total_versions: versions?.length || 0,
        current_version: currentVersion!,
        recent_changes: recentChanges
      };
    } catch (error) {
      console.error('Error fetching version history:', error);
      throw error;
    }
  }

  /**
   * Create a new version of a prompt
   */
  static async createVersion(
    promptId: string,
    title: string,
    content: string,
    changeDescription?: string,
    parentVersionId?: string
  ): Promise<PromptVersion> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Get the next version number
      const { data: existingVersions } = await supabase
        .from('prompt_versions')
        .select('version_number')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersionNumber = (existingVersions?.[0]?.version_number || 0) + 1;

      // Create the new version
      const { data: newVersion, error } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: promptId,
          user_id: user.user.id,
          version_number: nextVersionNumber,
          title,
          content,
          change_description: changeDescription,
          parent_version_id: parentVersionId,
          is_current: true // This will trigger the database function to set others to false
        })
        .select()
        .single();

      if (error) throw error;

      // Update the saved prompt with the latest content
      await supabase
        .from('saved_prompts')
        .update({
          title,
          optimized_prompt: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId);

      return newVersion;
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }

  /**
   * Get a specific version by ID
   */
  static async getVersion(versionId: string): Promise<PromptVersion> {
    try {
      const { data: version, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (error) throw error;
      return version;
    } catch (error) {
      console.error('Error fetching version:', error);
      throw error;
    }
  }

  /**
   * Set a specific version as current
   */
  static async setCurrentVersion(versionId: string): Promise<void> {
    try {
      const version = await this.getVersion(versionId);
      
      // Update the version to be current (triggers database function)
      const { error } = await supabase
        .from('prompt_versions')
        .update({ is_current: true })
        .eq('id', versionId);

      if (error) throw error;

      // Update the saved prompt with this version's content
      await supabase
        .from('saved_prompts')
        .update({
          title: version.title,
          optimized_prompt: version.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', version.prompt_id);
    } catch (error) {
      console.error('Error setting current version:', error);
      throw error;
    }
  }

  /**
   * Delete a version (cannot delete current version)
   */
  static async deleteVersion(versionId: string): Promise<void> {
    try {
      const version = await this.getVersion(versionId);
      
      if (version.is_current) {
        throw new Error('Cannot delete the current version');
      }

      const { error } = await supabase
        .from('prompt_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting version:', error);
      throw error;
    }
  }

  /**
   * Create a comparison between two versions
   */
  static async createComparison(
    versionAId: string,
    versionBId: string,
    notes?: string
  ): Promise<PromptComparison> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: comparison, error } = await supabase
        .from('prompt_comparisons')
        .insert({
          user_id: user.user.id,
          version_a_id: versionAId,
          version_b_id: versionBId,
          comparison_notes: notes
        })
        .select()
        .single();

      if (error) throw error;
      return comparison;
    } catch (error) {
      console.error('Error creating comparison:', error);
      throw error;
    }
  }

  /**
   * Get user's comparison history
   */
  static async getComparisons(limit = 20): Promise<PromptComparison[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: comparisons, error } = await supabase
        .from('prompt_comparisons')
        .select(`
          *,
          version_a:prompt_versions!version_a_id(*),
          version_b:prompt_versions!version_b_id(*)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return comparisons || [];
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      throw error;
    }
  }

  /**
   * Get version differences (simple text diff)
   */
  static getVersionDiff(versionA: PromptVersion, versionB: PromptVersion) {
    const aLines = versionA.content.split('\n');
    const bLines = versionB.content.split('\n');
    
    const changes: Array<{
      type: 'added' | 'removed' | 'unchanged';
      content: string;
      lineNumber: number;
    }> = [];

    const maxLines = Math.max(aLines.length, bLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const aLine = aLines[i] || '';
      const bLine = bLines[i] || '';
      
      if (aLine === bLine) {
        changes.push({ type: 'unchanged', content: aLine, lineNumber: i + 1 });
      } else if (aLine && !bLine) {
        changes.push({ type: 'removed', content: aLine, lineNumber: i + 1 });
      } else if (!aLine && bLine) {
        changes.push({ type: 'added', content: bLine, lineNumber: i + 1 });
      } else {
        changes.push({ type: 'removed', content: aLine, lineNumber: i + 1 });
        changes.push({ type: 'added', content: bLine, lineNumber: i + 1 });
      }
    }
    
    return changes;
  }

  /**
   * Branch from a specific version (create a new version based on an older one)
   */
  static async branchFromVersion(
    versionId: string,
    newTitle: string,
    newContent: string,
    changeDescription?: string
  ): Promise<PromptVersion> {
    try {
      const sourceVersion = await this.getVersion(versionId);
      
      return await this.createVersion(
        sourceVersion.prompt_id,
        newTitle,
        newContent,
        changeDescription || `Branched from version ${sourceVersion.version_number}`,
        versionId
      );
    } catch (error) {
      console.error('Error branching from version:', error);
      throw error;
    }
  }
}