#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { generateProjectPrompt, GenerateExtractPrompt } = require('./dashPrompt.js'); 
const { generateHTML } = require('./dashGenerateHtml.js'); 
const {  shouldIncludeFile, shouldSkipDirectory, matchesIgnorePattern, loadLLMIgnore, getLLMIgnoreInfo  } = require('./dashIgnore.js'); 
const { SnapshotManager } = require('./dashSnapshot.js');
const { TestRunner } = require('./dashTest.js');
const { PatchManager } = require('./dashPatch.js');
const { ProjectManager } = require('./dashProject.js');
const { PatchHistoryManager } = require('./dashPatchHistory.js');
const crypto = require('crypto');

const extractPrompt = GenerateExtractPrompt();

// Instance file management
function createInstanceFile(projectDir, port) {
  const instanceDir = '/tmp/vibedash-instances';
  
  // Create instance directory if it doesn't exist
  if (!fs.existsSync(instanceDir)) {
    fs.mkdirSync(instanceDir, { recursive: true });
  }
  
  // Generate MD5 hash of directory path (matching bash script logic)
  const dirHash = crypto.createHash('md5').update(projectDir).digest('hex');
  const instanceFile = path.join(instanceDir, `vibedash-${dirHash}.json`);
  
  // Write instance file
  const instanceData = {
    pid: process.pid,
    port: port,
    projectDir: projectDir
  };
  
  fs.writeFileSync(instanceFile, JSON.stringify(instanceData, null, 2));
  
  return instanceFile;
}

function removeInstanceFile(instanceFile) {
  try {
    if (fs.existsSync(instanceFile)) {
      fs.unlinkSync(instanceFile);
    }
  } catch (e) {
    console.error('Error removing instance file:', e);
  }
}


class LLMMetaServer {
 constructor( projectDir ) {
   this.projectDir = projectDir;
   this.projectName = path.basename(this.projectDir);
   this.port = null;
   this.server = null;
   this.instanceFile = null; 
   
   // Initialize managers in correct order (snapshot manager needed by patch history)
   this.test = new TestRunner(this.projectDir);
   this.patch = new PatchManager(this.projectDir);
   this.project = new ProjectManager(this.projectDir, 
     (filePath) => this.shouldIncludeFile(filePath), 
     (dirPath) => this.shouldSkipDirectory(dirPath));
   this.snapshot = new SnapshotManager(this.projectDir, this.project);
   this.patchHistory = new PatchHistoryManager(this.projectDir, this.snapshot);
   
   this.loadLLMIgnore();
 }

 loadLLMIgnore() {
   loadLLMIgnore( this.projectDir );
 }

 matchesIgnorePattern(filePath) {
   return matchesIgnorePattern(filePath);
 }

 shouldIncludeFile(filePath) {
   return shouldIncludeFile(filePath );
 }

 shouldSkipDirectory(dirPath) {
   return shouldSkipDirectory(dirPath);
 }

 handleRequest(req, res) {
   const parsedUrl = url.parse(req.url, true);
   const pathname = parsedUrl.pathname;

   // CORS headers
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

   if (req.method === 'OPTIONS') {
     res.writeHead(200);
     res.end();
     return;
   }

   try {
     if (pathname === '/') {
       this.serveHTML(res);
     } else if (pathname === '/api/extract') {
       // DELEGATE to project manager
       this.project.handleExtract(req, res, this.projectName, extractPrompt);
     } else if (pathname === '/api/extract-interface') {
       // DELEGATE to project manager for interface extraction
       this.project.handleExtractInterface(req, res, this.projectName, extractPrompt );
     } else if (pathname === '/api/patch') {
       // DELEGATE to patch manager with history tracking
       this.handlePatchWithHistory(req, res);
     } else if (pathname === '/api/request') {
       // DELEGATE to patch manager
       this.patch.handleFileRequestEndpoint(req, res, this.projectName);
     } else if (pathname === '/api/snapshot') {
       // DELEGATE to snapshot manager
       this.snapshot.handleSnapshot(req, res);
     } else if (pathname === '/api/snapshots') {
       // DELEGATE to snapshot manager
       this.snapshot.handleListSnapshots(req, res);
     } else if (pathname.startsWith('/api/restore/')) {
       // DELEGATE to snapshot manager
       this.snapshot.handleRestore(req, res);
     } else if (pathname === '/api/patches') {
       // DELEGATE to patch history manager
       this.patchHistory.handleList(req, res);
     } else if (pathname.startsWith('/api/patch/')) {
       // DELEGATE to patch history manager
       this.patchHistory.handleGet(req, res);
     } else if (pathname === '/api/clear-patches') {
       // DELEGATE to patch history manager
       this.patchHistory.handleClear(req, res);
     } else if (pathname === '/api/status') {
       // DELEGATE to project manager with patch count
       this.handleStatus(req, res);
     } else if (pathname === '/api/tree') {
       // DELEGATE to project manager
       this.project.handleDirectoryTree(req, res);
     } else if (pathname === '/api/llmignore') {
       this.handleLLMIgnore(req, res);
     } else if (pathname === '/api/test') {
       // DELEGATE to test runner
       this.test.handleTest(req, res);
     } else if (pathname === '/api/project-prompt') {
       this.handleProjectPrompt(req, res);
     } else {
       res.writeHead(404, { 'Content-Type': 'text/plain' });
       res.end('Not Found');
     }
   } catch (err) {
     console.error('Request error:', err);
     res.writeHead(500, { 'Content-Type': 'application/json' });
     res.end(JSON.stringify({ error: err.message }));
   }
 }

 handlePatchWithHistory(req, res) {
   console.log('[Main Server] handlePatchWithHistory called');
   let body = '';
   req.on('data', chunk => {
     body += chunk;
     console.log('[Main Server] Received chunk:', chunk.length, 'bytes');
   });
   req.on('end', () => {
     console.log('[Main Server] Complete request body:', body.length, 'bytes');
     try {
       const requestData = JSON.parse(body);
       console.log('[Main Server] Parsed request keys:', Object.keys(requestData));
       
       let result;
       let patchTextForHistory;
       
       // Handle new parsed format
       if (requestData.type === 'parsed' && requestData.files) {
         console.log('[Main Server] Handling new parsed format with', Object.keys(requestData.files).length, 'files');
         
         // Apply the parsed patch directly
         result = this.patch.applyParsedPatch(requestData);
         
         // Use original patch text for history, or reconstruct if not available
         patchTextForHistory = requestData.originalPatch || this.reconstructPatchText(requestData.files);
         
         console.log('[Main Server] Applied parsed patch, result:', result);
         
       } else if (requestData.patch) {
         console.log('[Main Server] Handling legacy text format, patch length:', requestData.patch.length);
         
         // Handle legacy text format
         result = this.patch.applyPatch(requestData.patch);
         patchTextForHistory = requestData.patch;
         
         console.log('[Main Server] Applied legacy patch, result:', result);
         
       } else {
         throw new Error('Invalid request format: expected either {type: "parsed", files: {...}} or {patch: "..."}');
       }
       
       // Save to patch history with automatic snapshot
       console.log('[Main Server] Saving to patch history...');
       this.patchHistory.savePatch(patchTextForHistory, result);
       
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(result));
       console.log('[Main Server] Response sent successfully');
       
     } catch (err) {
       console.error('[Main Server] Error in handlePatchWithHistory:', err.message);
       console.error('[Main Server] Error stack:', err.stack);
       res.writeHead(400, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify({ error: 'Invalid patch format: ' + err.message }));
     }
   });
 }

 // Helper method to reconstruct patch text from parsed files (for history)
 reconstructPatchText(files) {
   let patchText = '=== PATCH ===\n\n';
   
   Object.entries(files).forEach(([filePath, content]) => {
     patchText += `--- FILE: ${filePath} ---\n`;
     patchText += content;
     patchText += '\n--- ENDFILE ---\n\n';
   });
   
   return patchText;
 }

 handleStatus(req, res) {
   const files = this.project.scanProject();
   const patches = this.patchHistory.listPatches();
   const status = {
     project: this.projectName,
     directory: this.projectDir,
     fileCount: Object.keys(files).length,
     snapshotCount: this.snapshot.listSnapshots().length,
     patchCount: patches.length
   };
   res.writeHead(200, { 'Content-Type': 'application/json' });
   res.end(JSON.stringify(status));
 }

 serveHTML(res) {
   const html = this.generateHTML();
   res.writeHead(200, { 'Content-Type': 'text/html' });
   res.end(html);
 }

 handleProjectPrompt(req, res) {
   let body = '';
   req.on('data', chunk => body += chunk);
   req.on('end', () => {
     try {
       const { userInput } = JSON.parse(body);
       const prompt = this.generateProjectPrompt(userInput);
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify({ prompt }));
     } catch (err) {
       res.writeHead(400, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify({ error: 'Invalid request: ' + err.message }));
     }
   });
 }

 generateProjectPrompt(userInput) {
   return generateProjectPrompt(userInput);
 }
  
 handleLLMIgnore(req, res) {
   if (req.method === 'POST') {
     // Reload .llmignore
     this.loadLLMIgnore();
   }
   
   const info = getLLMIgnoreInfo(this.projectDir);
   
   res.writeHead(200, { 'Content-Type': 'application/json' });
   res.end(JSON.stringify(info));
 }

 generateHTML() {
   const projectName = this.projectName;
   const projectDir = this.projectDir;
   
   return generateHTML(projectName, projectDir);
 }

 async findFreePort(startPort = 3000) {
   return new Promise((resolve, reject) => {
     const server = http.createServer();
     server.listen(startPort, (err) => {
       if (err) {
         if (err.code === 'EADDRINUSE') {
           server.close();
           this.findFreePort(startPort + 1).then(resolve).catch(reject);
         } else {
           reject(err);
         }
       } else {
         const port = server.address().port;
         server.close();
         resolve(port);
       }
     });
   });
 }

 async start() {
   this.port = await this.findFreePort();

   this.instanceFile = createInstanceFile(this.projectDir, this.port);

   this.server = http.createServer((req, res) => this.handleRequest(req, res));
   
   this.server.listen(this.port, () => {
     console.log(`Project "${this.projectName}" is listening on port ${this.port}`);
     console.log(`Open http://localhost:${this.port} in your browser`);
   });
 }
}

// get the first commandline parameter
const projectDir = process.argv[2] || "/unknown_folder";
// Start the server
const server = new LLMMetaServer( projectDir );

process.on('exit', () => {
  if (server.instanceFile) {
    removeInstanceFile(server.instanceFile);
  }
});

// Handle signals for graceful shutdown
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    if (server.instanceFile) {
      removeInstanceFile(server.instanceFile);
    }
    process.exit(0);
  });
});


server.start().catch(console.error);