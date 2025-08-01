const fs = require('fs');
const path = require('path');

class PatchManager {
  constructor(projectDir) {
    this.projectDir = projectDir;
  }

  // New method to handle pre-parsed patches from client
  applyParsedPatch(parsedData) {
    console.log(`[PatchManager] applyParsedPatch called with:`, Object.keys(parsedData));
    const results = { type: 'patch', applied: [], errors: [] };
    
    if (!parsedData || !parsedData.files || typeof parsedData.files !== 'object') {
      console.log(`[PatchManager] Invalid parsed data structure`);
      results.errors.push({ file: 'N/A', error: 'Invalid parsed patch structure - missing files object' });
      return results;
    }
    
    const fileEntries = Object.entries(parsedData.files);
    console.log(`[PatchManager] Applying ${fileEntries.length} files:`, Object.keys(parsedData.files));
    
    fileEntries.forEach(([filePath, content]) => {
      try {
        if (typeof content !== 'string') {
          throw new Error('File content must be a string, got: ' + typeof content);
        }
        
        const fullPath = path.join(this.projectDir, filePath);
        const dir = path.dirname(fullPath);
        
        console.log(`[PatchManager] Writing file: ${fullPath}`);
        console.log(`[PatchManager] Content length: ${content.length}`);
        
        // Ensure directory exists
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`[PatchManager] Created directory: ${dir}`);
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
        results.applied.push(filePath);
        console.log(`[PatchManager] ✓ Successfully wrote: ${filePath}`);
      } catch (err) {
        console.log(`[PatchManager] ✗ Error writing ${filePath}: ${err.message}`);
        results.errors.push({ file: filePath, error: err.message });
      }
    });
    
    console.log(`[PatchManager] Results: ${results.applied.length} applied, ${results.errors.length} errors`);
    return results;
  }

  // Keep old method for backward compatibility
  parsePatch(patchText) {
    console.log(`[Parser] ============ STARTING PATCH PARSE ============`);
    console.log(`[Parser] Input length: ${patchText.length} characters`);
    
    const lines = patchText.split('\\n');
    console.log(`[Parser] Split into ${lines.length} lines`);
    
    const patch = { type: 'unknown', files: {}, requests: [] };
    
    let currentFile = null;
    let currentContent = [];
    let mode = 'detect';
    let insideFile = false;
    let fileStartLine = -1;
    let patchModeStarted = false;  // NEW: Track if we've committed to patch mode
    let requestModeStarted = false;  // NEW: Track if we've committed to request mode
    
    // Debug: show first few lines of input
    console.log(`[Parser] First 5 lines of input:`);
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`[Parser]   Line ${i}: "${lines[i]}"`);
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      console.log(`[Parser] Line ${i}: insideFile=${insideFile}, mode=${mode}, currentFile=${currentFile}`);
      console.log(`[Parser]   patchModeStarted=${patchModeStarted}, requestModeStarted=${requestModeStarted}`);
      console.log(`[Parser]   Raw: "${line}"`);
      console.log(`[Parser]   Trimmed: "${trimmedLine}"`);
      
      // PARANOID RULE 1: Only process commands when NOT inside a file
      if (!insideFile) {
        console.log(`[Parser]   Not inside file, checking for commands...`);
        
        // Detect patch mode (only if we haven't committed to any mode yet)
        if (trimmedLine === '=== PATCH ===' && !patchModeStarted && !requestModeStarted) {
          patch.type = 'patch';
          mode = 'patch';
          patchModeStarted = true;
          console.log(`[Parser]   ✓ MATCHED: PATCH command at line ${i} - COMMITTED TO PATCH MODE`);
          continue;
        } else if (trimmedLine === '=== PATCH ===' && (patchModeStarted || requestModeStarted)) {
          console.log(`[Parser]   ✗ IGNORED: PATCH command found but already committed to ${patchModeStarted ? 'patch' : 'request'} mode`);
          continue;
        }
        
        // Detect request mode (only if we haven't committed to any mode yet)
        if (trimmedLine === '=== REQUEST ===' && !patchModeStarted && !requestModeStarted) {
          patch.type = 'request';
          mode = 'request';
          requestModeStarted = true;
          console.log(`[Parser]   ✓ MATCHED: REQUEST command at line ${i} - COMMITTED TO REQUEST MODE`);
          continue;
        } else if (trimmedLine === '=== REQUEST ===' && (patchModeStarted || requestModeStarted)) {
          console.log(`[Parser]   ✗ IGNORED: REQUEST command found but already committed to ${patchModeStarted ? 'patch' : 'request'} mode`);
          continue;
        }
        
        // Handle REQUEST_FILES (only in request mode and outside files)
        if (trimmedLine.startsWith('REQUEST_FILES:')) {
          console.log(`[Parser]   Found REQUEST_FILES pattern, mode is: ${mode}, requestModeStarted: ${requestModeStarted}`);
          if (mode === 'request' && requestModeStarted) {
            const files = trimmedLine.replace('REQUEST_FILES:', '').trim().split(',').map(f => f.trim());
            patch.requests = files;
            console.log(`[Parser]   ✓ MATCHED: REQUEST_FILES at line ${i}: ${files.join(', ')}`);
          } else {
            console.log(`[Parser]   ✗ IGNORED: REQUEST_FILES found but mode is ${mode}, requestModeStarted: ${requestModeStarted}`);
          }
          continue;
        }
        
        // Handle file start (only when not already inside a file)
        if (trimmedLine.startsWith('--- FILE: ') && trimmedLine.endsWith(' ---')) {
          console.log(`[Parser]   Found FILE pattern...`);
          
          // Save previous file if exists
          if (currentFile && mode === 'patch' && patchModeStarted) {
            const content = currentContent.join('\\n');
            patch.files[currentFile] = content;
            console.log(`[Parser]   ✓ SAVED: Previous file ${currentFile} (${content.length} chars)`);
          }
          
          // Extract filename between "--- FILE: " and " ---"
          const fileMatch = trimmedLine.match(/^--- FILE: (.+) ---$/);
          if (fileMatch) {
            currentFile = fileMatch[1].trim();
            currentContent = [];
            insideFile = true;
            fileStartLine = i;
            console.log(`[Parser]   ✓ MATCHED: Started file ${currentFile} at line ${i}`);
          } else {
            console.log(`[Parser]   ✗ REGEX FAILED: Could not extract filename from "${trimmedLine}"`);
          }
          continue;
        } else if (trimmedLine.startsWith('--- FILE:')) {
          console.log(`[Parser]   ✗ PARTIAL FILE MATCH: "${trimmedLine}" (missing end marker?)`);
        }
        
        console.log(`[Parser]   No command matched, treating as regular content`);
      } else {
        console.log(`[Parser]   Inside file ${currentFile}, treating as content`);
      }
      
      // PARANOID RULE 2: Handle file end markers at any time (even inside files)
      if (trimmedLine === '--- ENDFILE ---') {
        console.log(`[Parser]   Found ENDFILE marker`);
        if (currentFile && mode === 'patch' && insideFile && patchModeStarted) {
          const content = currentContent.join('\\n');
          patch.files[currentFile] = content;
          console.log(`[Parser]   ✓ ENDED: File ${currentFile} at line ${i} (${content.length} chars)`);
          console.log(`[Parser]   Content preview: "${content.substring(0, 100)}..."`);
          currentFile = null;
          currentContent = [];
          insideFile = false;
          fileStartLine = -1;
        } else {
          console.log(`[Parser]   ✗ IGNORED ENDFILE: currentFile=${currentFile}, mode=${mode}, insideFile=${insideFile}, patchModeStarted=${patchModeStarted}`);
        }
        continue;
      }
      
      // PARANOID RULE 3: When inside a file, EVERYTHING is content (ignore all commands)
      if (insideFile && currentFile && mode === 'patch' && patchModeStarted) {
        currentContent.push(line);  // Use original line, not trimmed
        console.log(`[Parser]   ✓ ADDED TO CONTENT: Line ${i} added to file ${currentFile} (now ${currentContent.length} lines)`);
        
        // Debug: warn if we see command-like patterns inside files
        if (trimmedLine === '=== PATCH ===' || trimmedLine === '=== REQUEST ===' || 
            trimmedLine.startsWith('REQUEST_FILES:') || trimmedLine.startsWith('--- FILE:')) {
          console.log(`[Parser]   ⚠️  WARNING: Found command-like pattern inside file ${currentFile} at line ${i}: "${trimmedLine}"`);
          console.log(`[Parser]   This is being treated as file content, not a command.`);
        }
      } else if (insideFile) {
        console.log(`[Parser]   ✗ NOT ADDED: insideFile=${insideFile}, currentFile=${currentFile}, mode=${mode}, patchModeStarted=${patchModeStarted}`);
      }
    }
    
    // PARANOID RULE 4: Handle final file if no ENDFILE marker (backward compatibility)
    if (currentFile && mode === 'patch' && insideFile && patchModeStarted) {
      const content = currentContent.join('\\n');
      patch.files[currentFile] = content;
      console.log(`[Parser] ✓ SAVED FINAL: File ${currentFile} (no ENDFILE marker) (${content.length} chars)`);
      console.log(`[Parser] Content preview: "${content.substring(0, 100)}..."`);
    }
    
    console.log(`[Parser] ============ PARSE COMPLETE ============`);
    console.log(`[Parser] Final result:`);
    console.log(`[Parser]   Type: ${patch.type}`);
    console.log(`[Parser]   Files: ${Object.keys(patch.files).length}`);
    console.log(`[Parser]   File names: ${Object.keys(patch.files).join(', ')}`);
    console.log(`[Parser]   Requests: ${patch.requests.length}`);
    console.log(`[Parser]   Request files: ${patch.requests.join(', ')}`);
    
    return patch;
  }

  applyPatch(patchText) {
    console.log(`[PatchManager] applyPatch called with ${patchText.length} characters`);
    const patch = this.parsePatch(patchText);
    const results = { type: patch.type, applied: [], errors: [] };
    
    console.log(`[PatchManager] Parsed patch type: ${patch.type}`);
    
    if (patch.type === 'patch') {
      console.log(`[PatchManager] Applying ${Object.keys(patch.files).length} files...`);
      Object.entries(patch.files).forEach(([filePath, content]) => {
        try {
          const fullPath = path.join(this.projectDir, filePath);
          const dir = path.dirname(fullPath);
          
          console.log(`[PatchManager] Writing file: ${fullPath}`);
          console.log(`[PatchManager] Content length: ${content.length}`);
          
          // Ensure directory exists
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[PatchManager] Created directory: ${dir}`);
          }
          
          fs.writeFileSync(fullPath, content, 'utf8');
          results.applied.push(filePath);
          console.log(`[PatchManager] ✓ Successfully wrote: ${filePath}`);
        } catch (err) {
          console.log(`[PatchManager] ✗ Error writing ${filePath}: ${err.message}`);
          results.errors.push({ file: filePath, error: err.message });
        }
      });
    } else {
      console.log(`[PatchManager] Not a patch type, skipping file operations`);
    }
    
    console.log(`[PatchManager] Results: ${results.applied.length} applied, ${results.errors.length} errors`);
    return results;
  }

  handleFileRequest(requestedFiles, projectName) {
    console.log(`[PatchManager] handleFileRequest called with ${requestedFiles.length} files`);
    let response = `=== REQUEST RESPONSE ===\\n`;
    response += `Project: ${projectName}\\n`;
    response += `Timestamp: ${new Date().toISOString()}\\n`;
    response += `Requested Files: ${requestedFiles.length}\\n\\n`;
    
    const found = [];
    const notFound = [];
    
    requestedFiles.forEach(filePath => {
      console.log(`[PatchManager] Processing request for: ${filePath}`);
      const fullPath = path.join(this.projectDir, filePath);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          response += `--- FILE: ${filePath} ---\\n${content}\\n\\n`;
          found.push(filePath);
          console.log(`[PatchManager] ✓ Found and read: ${filePath} (${content.length} chars)`);
        } catch (err) {
          response += `--- FILE: ${filePath} ---\\n[ERROR READING FILE: ${err.message}]\\n\\n`;
          notFound.push(filePath);
          console.log(`[PatchManager] ✗ Error reading ${filePath}: ${err.message}`);
        }
      } else {
        response += `--- FILE: ${filePath} ---\\n[FILE NOT FOUND]\\n\\n`;
        notFound.push(filePath);
        console.log(`[PatchManager] ✗ File not found: ${fullPath}`);
      }
    });
    
    console.log(`[PatchManager] Request complete: ${found.length} found, ${notFound.length} not found`);
    return { response, found, notFound };
  }

  // HTTP handlers for patch and request endpoints
  handlePatch(req, res) {
    console.log(`[PatchManager] handlePatch HTTP endpoint called`);
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      console.log(`[PatchManager] Received chunk: ${chunk.length} bytes`);
    });
    req.on('end', () => {
      console.log(`[PatchManager] Complete request body: ${body.length} bytes`);
      try {
        const parsed = JSON.parse(body);
        console.log(`[PatchManager] Parsed JSON keys: ${Object.keys(parsed).join(', ')}`);
        console.log(`[PatchManager] Parsed JSON structure:`, JSON.stringify(parsed, null, 2));
        
        // Check if this is a pre-parsed patch from client
        if (parsed.type === 'parsed') {
          console.log(`[PatchManager] Detected parsed patch type`);
          
          if (!parsed.files) {
            throw new Error('Parsed patch missing files object');
          }
          
          console.log(`[PatchManager] Files object keys: ${Object.keys(parsed.files).join(', ')}`);
          console.log(`[PatchManager] Calling applyParsedPatch...`);
          
          const result = this.applyParsedPatch(parsed);
          
          console.log(`[PatchManager] applyParsedPatch returned:`, result);
          console.log(`[PatchManager] Result type: ${typeof result}`);
          console.log(`[PatchManager] Result keys: ${result ? Object.keys(result).join(', ') : 'null'}`);
          
          if (!result) {
            throw new Error('applyParsedPatch returned null/undefined');
          }
          
          if (!result.applied) {
            console.log(`[PatchManager] WARNING: result.applied is undefined, setting to empty array`);
            result.applied = [];
          }
          
          if (!result.errors) {
            console.log(`[PatchManager] WARNING: result.errors is undefined, setting to empty array`);
            result.errors = [];
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          console.log(`[PatchManager] Sent parsed patch response successfully`);
          
        } else if (parsed.patch) {
          // Fallback to old text-based parsing
          console.log(`[PatchManager] Handling legacy text patch: ${parsed.patch.length} characters`);
          const result = this.applyPatch(parsed.patch);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          console.log(`[PatchManager] Sent legacy patch response: ${JSON.stringify(result)}`);
        } else {
          throw new Error('Invalid patch format: expected either {type: "parsed", files: {...}} or {patch: "..."}');
        }
      } catch (err) {
        console.log(`[PatchManager] Error in handlePatch: ${err.message}`);
        console.log(`[PatchManager] Error stack: ${err.stack}`);
        console.log(`[PatchManager] Request body was: ${body.substring(0, 500)}...`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid patch format: ' + err.message }));
      }
    });
  }

  handleFileRequestEndpoint(req, res, projectName) {
    console.log(`[PatchManager] handleFileRequestEndpoint HTTP endpoint called for project: ${projectName}`);
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      console.log(`[PatchManager] Received chunk: ${chunk.length} bytes`);
    });
    req.on('end', () => {
      console.log(`[PatchManager] Complete request body: ${body.length} bytes`);
      try {
        const parsed = JSON.parse(body);
        console.log(`[PatchManager] Parsed JSON keys: ${Object.keys(parsed).join(', ')}`);
        const { files } = parsed;
        console.log(`[PatchManager] Extracted files: ${files ? files.length : 'null'} files`);
        
        const result = this.handleFileRequest(files, projectName);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        console.log(`[PatchManager] Sent response with ${result.found.length} found, ${result.notFound.length} not found`);
      } catch (err) {
        console.log(`[PatchManager] Error in handleFileRequestEndpoint: ${err.message}`);
        console.log(`[PatchManager] Stack: ${err.stack}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request format: ' + err.message }));
      }
    });
  }
}

module.exports = { PatchManager };
