const { generateCSS } = require('./dashGenerateCss.js'); 
const { generateJS } = require('./dashGenerateJs.js'); 

function generateHTML( projectName, projectDir ) {
   
   return `<!DOCTYPE html>
<html>
<head>
   <title>${projectName} - Vibe Dash</title>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <style>` + generateCSS() + `</style>
</head>
<body>
   <div class="container">
       <div class="header">
           <h1>Vibe Dash</h1>
           <p>Project: <strong>${projectName}</strong> | Directory: ${projectDir}</p>
       </div>
       
       <div class="status" id="status">
           <div id="status-text">Ready</div>
           <div id="status-info" class="info"></div>
       </div>

       <div class="grid">
           <div class="card">
               <h2>Project Management</h2>
               <button onclick="extractProject()">Extract Project to Clipboard</button>
               <button onclick="extractInterface()">Extract Interface to Clipboard</button>
               <button onclick="refreshStatus()">Refresh Status</button>
               <button class="secondary" onclick="reloadLLMIgnore()">Reload .llmignore</button>
               <button class="success" onclick="runTest()">🧪 Run Test (.llmtest)</button>
               <div id="project-info" class="info">Loading...</div>
               <div id="llmignore-info" class="info">Loading ignore patterns...</div>
               <div id="file-list" class="file-list" style="display: none;"></div>
           </div>
           
           <div class="card patch">
               <h2>Patch & Request</h2>
               <textarea id="patch-input" placeholder="Paste patch or request here...

Patch format:
=== PATCH ===
--- FILE: path/to/file.js ---
file content here

Request format:
=== REQUEST ===
REQUEST_FILES: file1.js, file2.py"></textarea>
               <button onclick="applyPatch()">Apply Patch/Request</button>
           </div>
           
           <div class="card snapshot">
               <h2>Snapshot Management</h2>
               <div class="snapshot-controls">
                   <button class="warning" onclick="createSnapshot()">📸 Create Snapshot</button>
                   <button class="secondary" onclick="loadSnapshots()">Refresh Snapshots</button>
               </div>
               <div class="snapshot-list-container">
                   <div id="snapshots-list" class="snapshot-list">
                       <div class="empty-state">Loading snapshots...</div>
                   </div>
               </div>
               <div class="snapshot-info">Create snapshots before major changes</div>
           </div>
           
           <div class="card history">
               <h2>Patch History</h2>
               <div class="patch-history">
                   <div style="color: #10b981; font-weight: bold; margin-bottom: 0.5rem;">⚡ Recent Patches</div>
                   <div id="patch-history-content">No patches applied yet</div>
               </div>
               <button class="secondary" onclick="clearPatchHistory()">Clear History</button>
           </div>
           
           <div class="card files">
               <h2>File Browser</h2>
               <div class="directory-tree">
                   <div style="color: #10b981; font-weight: bold; margin-bottom: 0.5rem;">📁 Project Structure</div>
                   <div id="directory-tree-content">Loading...</div>
               </div>
               <button class="secondary" onclick="loadDirectoryTree()">Refresh Tree</button>
           </div>
           
           <div class="card future">
               <h2>New Project Prompt</h2>
               <textarea id="project-input" placeholder="Describe the project you want to create...

Example:
Create a React todo app with TypeScript, Tailwind CSS, and local storage. Include add/delete/toggle functionality with a clean modern UI."></textarea>
               <button onclick="generateProjectPrompt()">🚀 Generate LLM Prompt</button>
               <div class="info">Generates a complete prompt with patch/request rules for LLMs</div>
           </div>
       </div>
       
       <!-- Test Output Modal -->
       <div id="test-modal" class="modal">
           <div class="modal-content">
               <button class="modal-close" onclick="closeTestModal()">×</button>
               <h3>Test Results</h3>
               <div id="test-results"></div>
               <button onclick="copyTestOutput()" style="margin-top: 1rem;">Copy Output to Clipboard</button>
           </div>
       </div>
       
       <!-- Patch Detail Modal -->
       <div id="patch-modal" class="modal">
           <div class="modal-content">
               <button class="modal-close" onclick="closePatchModal()">×</button>
               <h3>Patch Details</h3>
               <div id="patch-details"></div>
               <button onclick="copyPatchContent()" style="margin-top: 1rem;">Copy Patch to Clipboard</button>
           </div>
       </div>
       
       <div id="preview" class="preview" style="display: none;">
           <h3>Last Output Preview</h3>
           <pre id="preview-content"></pre>
       </div>
   </div>

   <script>` + generateJS() + `</script>
</body>
</html>`;
 }


module.exports = { generateHTML };
