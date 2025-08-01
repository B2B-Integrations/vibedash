const path = require('path');
const fs = require('fs');

let llmIgnorePatterns = [];

  function getLLMIgnoreInfo( projectDir ) {
      const info = {
        patterns: llmIgnorePatterns,
        count: llmIgnorePatterns.length,
        exists: fs.existsSync(path.join(projectDir, '.llmignore'))
      };

      return info;
  }

  function loadLLMIgnore( projectDir ) {

  console.log( `Loading .llmignore patterns from ${projectDir}`)
    const llmIgnorePath = path.join( projectDir, '.llmignore');
    llmIgnorePatterns = [];
    
    if (fs.existsSync(llmIgnorePath)) {
      try {
        const content = fs.readFileSync(llmIgnorePath, 'utf8');
        llmIgnorePatterns = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
        
        console.log(`Loaded ${llmIgnorePatterns.length} patterns from .llmignore`);
      } catch (err) {
        console.warn('Warning: Could not read .llmignore:', err.message);
      }
    }
  }

  function matchesIgnorePattern(filePath) {
    if (llmIgnorePatterns.length === 0) return false;
    
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    return llmIgnorePatterns.some(pattern => {
      // Convert glob-like pattern to regex
      let regexPattern = pattern
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/\*/g, '.*')   // Convert * to .*
        .replace(/\?/g, '.');   // Convert ? to .
      
      // If pattern doesn't start with /, it can match anywhere in the path
      if (!pattern.startsWith('/')) {
        regexPattern = '(^|/)' + regexPattern;
      } else {
        regexPattern = '^' + regexPattern.slice(1); // Remove leading /
      }
      
      // If pattern doesn't end with specific extension or /, add word boundary
      if (!pattern.includes('.') && !pattern.endsWith('/')) {
        regexPattern += '(/|$)';
      }
      
      try {
        const regex = new RegExp(regexPattern);
        return regex.test(normalizedPath);
      } catch (err) {
        console.warn(`Warning: Invalid .llmignore pattern: ${pattern}`);
        return false;
      }
    });
  }

  function shouldIncludeFile(filePath) {
    // Check .llmignore first
    if (matchesIgnorePattern(filePath)) {
      return false;
    }
    
    return true; 
  }

  function shouldSkipDirectory(dirPath) {
    // Check .llmignore first
    if (matchesIgnorePattern(dirPath)) {
      return true;
    }
    
    const dirname = path.basename(dirPath);
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', 
                     '.vscode', '.idea', 'target', 'vendor', '.llm-backups'];
    return skipDirs.includes(dirname) || dirname.startsWith('.');
  }

  module.exports = { shouldIncludeFile, shouldSkipDirectory, matchesIgnorePattern, loadLLMIgnore, getLLMIgnoreInfo };