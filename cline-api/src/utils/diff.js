const { createPatch, parsePatch } = require('diff');

/**
 * Create a unified diff between two strings
 */
const createDiff = (oldContent, newContent, fileName = 'file') => {
  try {
    // Generate unified diff patch
    const patch = createPatch(
      fileName,
      oldContent || '',
      newContent || '',
      'original',
      'modified'
    );
    
    // Parse the patch to get statistics
    const parsed = parsePatch(patch)[0] || { hunks: [] };
    
    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    
    for (const hunk of parsed.hunks || []) {
      for (const line of hunk.lines || []) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deletions++;
        }
      }
    }
    
    // Count modifications (lines that are both added and deleted)
    modifications = Math.min(additions, deletions);
    
    const stats = {
      additions,
      deletions,
      modifications,
      total: additions + deletions
    };
    
    return {
      patch,
      stats
    };
    
  } catch (error) {
    console.error('Error creating diff:', error);
    return {
      patch: `Error generating diff: ${error.message}`,
      stats: {
        additions: 0,
        deletions: 0,
        modifications: 0,
        total: 0
      }
    };
  }
};

/**
 * Apply a patch to content
 */
const applyDiff = (originalContent, patch) => {
  try {
    const { applyPatch } = require('diff');
    const result = applyPatch(originalContent, patch);
    
    if (result === false) {
      throw new Error('Failed to apply patch - conflicts detected');
    }
    
    return result;
  } catch (error) {
    throw new Error(`Error applying diff: ${error.message}`);
  }
};

/**
 * Format diff for display
 */
const formatDiff = (patch) => {
  const lines = patch.split('\n');
  let formattedLines = [];
  
  for (const line of lines) {
    if (line.startsWith('+++') || line.startsWith('---')) {
      formattedLines.push(`${line}`);
    } else if (line.startsWith('@@')) {
      formattedLines.push(`${line}`);
    } else if (line.startsWith('+')) {
      formattedLines.push(`+ ${line.substring(1)}`);
    } else if (line.startsWith('-')) {
      formattedLines.push(`- ${line.substring(1)}`);
    } else {
      formattedLines.push(`  ${line}`);
    }
  }
  
  return formattedLines.join('\n');
};

module.exports = {
  createDiff,
  applyDiff,
  formatDiff
};