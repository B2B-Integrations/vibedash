const fs = require('fs');
const path = require('path');

class ProjectManager {
  constructor(projectDir, shouldIncludeFileCallback, shouldSkipDirectoryCallback) {
    this.projectDir = projectDir;
    this.shouldIncludeFile = shouldIncludeFileCallback;
    this.shouldSkipDirectory = shouldSkipDirectoryCallback;
  }

  scanProject() {
    const files = {};
    
    const scanDirectory = (dir, relativePath = '') => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativeFilePath = path.posix.join(relativePath, item);
          
          const stat = fs.lstatSync(fullPath);
          
          if (stat.isDirectory()) {
            if (!this.shouldSkipDirectory(relativeFilePath)) {
              scanDirectory(fullPath, relativeFilePath);
            }
          } else if (stat.isFile()) {
            if (this.shouldIncludeFile(relativeFilePath)) {
              try {
                const content = fs.readFileSync(fullPath, 'utf8');
                files[relativeFilePath] = content;
              } catch (err) {
                console.warn(`Warning: Could not read file ${relativeFilePath}: ${err.message}`);
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Warning: Could not read directory ${dir}: ${err.message}`);
      }
    };
    
    scanDirectory(this.projectDir);
    return files;
  }

  getDirectoryTree() {
    const buildTree = (dir, relativePath = '', level = 0) => {
      const tree = []; // ✅ Local tree array for each recursive call
      
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativeFilePath = path.posix.join(relativePath, item);
          
          const stat = fs.lstatSync(fullPath);
          
          if (stat.isDirectory()) {
            if (!this.shouldSkipDirectory(relativeFilePath)) {
              const dirNode = {
                name: item,
                type: 'directory',
                level: level,
                children: buildTree(fullPath, relativeFilePath, level + 1) // ✅ Recursive call returns children
              };
              tree.push(dirNode);
            }
          } else if (stat.isFile()) {
            if (this.shouldIncludeFile(relativeFilePath)) {
              try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const lines = content.split('\n').length;
                tree.push({
                  name: item,
                  type: 'file',
                  level: level,
                  lines: lines,
                  path: relativeFilePath
                });
              } catch (err) {
                console.warn(`Warning: Could not read file ${relativeFilePath}: ${err.message}`);
                tree.push({
                  name: item,
                  type: 'file',
                  level: level,
                  lines: 0,
                  path: relativeFilePath
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Warning: Could not read directory ${dir}: ${err.message}`);
      }
      
      return tree;
    };
    
    return buildTree(this.projectDir);
  }

  extractInterface(files) {
    let content = `# PROJECT INTERFACE EXTRACTION\n\n`;
    content += `This shows only the exports/interfaces of each file. To see the full content of any file, use:\n\n`;
    content += `\`\`\`\n=== REQUEST ===\nREQUEST_FILES: filename.js, another-file.py\n\`\`\`\n\n`;
    content += `---\n\n=== PROJECT INTERFACE ===\n`;
    content += `Project: ${path.basename(this.projectDir)}\n`;
    content += `Timestamp: ${new Date().toISOString()}\n`;
    content += `Files: ${Object.keys(files).length}\n\n`;

    Object.entries(files).forEach(([filePath, fileContent]) => {
      content += `--- FILE: ${filePath} ---\n`;
      
      const exports = this.extractFileInterface(filePath, fileContent);
      if (exports.length > 0) {
        content += `// Exports found - use REQUEST_FILES to see full content\n\n`;
        exports.forEach(exportLine => {
          content += exportLine + '\n';
        });
      } else {
        content += `// No exports detected - showing full content\n\n${fileContent}`;
      }
      
      content += `\n\n`;
    });

    return content;
  }

  extractFileInterface(filePath, content) {
    const exports = [];
    const lines = content.split('\n');
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
      // JavaScript/TypeScript exports
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('export ') || 
            trimmed.startsWith('exports.') || 
            trimmed.includes('module.exports')) {
          exports.push(line);
        }
      }
      
      // Special handling for module.exports objects
      const moduleExportsMatch = content.match(/module\.exports\s*=\s*\{[\s\S]*?\}/);
      if (moduleExportsMatch) {
        const fullExport = moduleExportsMatch[0];
        if (exports.some(line => line.includes('module.exports ='))) {
          exports.push(fullExport);
        }
      }
    } else if (ext === '.py') {
      // Python exports (functions, classes, variables at module level)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith('def ') || 
            trimmed.startsWith('class ') || 
            (trimmed.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/) && !line.startsWith(' '))) {
          exports.push(line);
        }
      }
    } else if (ext === '.json') {
      // JSON - show top-level keys
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed === 'object' && parsed !== null) {
          const keys = Object.keys(parsed);
          exports.push(`// JSON keys: ${keys.join(', ')}`);
          keys.slice(0, 5).forEach(key => {
            const type = typeof parsed[key];
            exports.push(`// ${key}: ${type}`);
          });
        }
      } catch {
        exports.push('// Invalid JSON');
      }
    } else if (ext === '.css' || ext === '.scss') {
      // CSS - show main selectors
      const selectors = content.match(/[.#]?[a-zA-Z][a-zA-Z0-9_-]*\s*\{/g);
      if (selectors) {
        const uniqueSelectors = [...new Set(selectors.map(s => s.replace(/\s*\{$/, '')))];
        exports.push(`/* CSS selectors: ${uniqueSelectors.slice(0, 10).join(', ')} */`);
      }
    } else if (ext === '.html') {
      // HTML - show title and main elements
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      if (titleMatch) {
        exports.push(`<!-- Title: ${titleMatch[1]} -->`);
      }
      const tags = content.match(/<(h1|h2|h3|div|section|article|nav|header|footer|main)/gi);
      if (tags) {
        const uniqueTags = [...new Set(tags.map(t => t.replace(/[<>]/g, '')))];
        exports.push(`<!-- Main elements: ${uniqueTags.slice(0, 10).join(', ')} -->`);
      }
    }
    
    return exports;
  }

  // HTTP handlers for project endpoints
  handleExtract(req, res, projectName, promptTemplate) {
    const files = this.scanProject();
    const extractedContent = this.generateExtractContent(files, projectName);
    

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      content: promptTemplate.replace("{{project}}", extractedContent ),
      fileCount: Object.keys(files).length 
    }));
  }

  handleExtractInterface(req, res, projectName, promptTemplate ) {
    const files = this.scanProject();
    const interfaceContent = this.extractInterface(files);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      content: promptTemplate.replace("{{project}}", interfaceContent ),
      fileCount: Object.keys(files).length 
    }));
  }

  handleDirectoryTree(req, res) {
    const tree = this.getDirectoryTree();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tree));
  }

  generateExtractContent(files, projectName) {
    let content = `=== PROJECT EXTRACTION ===\n`;
    content += `Project: ${projectName}\n`;
    content += `Timestamp: ${new Date().toISOString()}\n`;
    content += `Files: ${Object.keys(files).length}\n\n`;

    Object.entries(files).forEach(([filePath, fileContent]) => {
      content += `--- FILE: ${filePath} ---\n${fileContent}\n\n`;
    });

    return content;
  }
}

module.exports = { ProjectManager };
