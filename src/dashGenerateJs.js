const { generateJS_PRJ } = require('./dashGenerateJs-projects.js'); 
const { generateJS_SNAP } = require('./dashGenerateJs-snapshot.js'); 
const { generateJS_PATCH } = require('./dashGenerateJs-patch.js');

function generateJS() {
   
   return `
       let currentFiles = [];
       let lastTestOutput = '';

       ` + generateJS_PATCH() + `
       ` + generateJS_PRJ() + `
       ` + generateJS_SNAP() + `
       
       async function apiCall(endpoint, method, data) {
           method = method || 'GET';
           const options = { method: method, headers: { 'Content-Type': 'application/json' } };
           if (data) options.body = JSON.stringify(data);
           
           const response = await fetch('/api/' + endpoint, options);
           return await response.json();
       }
       
       function setStatus(text, info) {
           info = info || '';
           document.getElementById('status-text').textContent = text;
           document.getElementById('status-info').textContent = info;
       }
       
       function showPreview(content, title) {
           title = title || 'Output Preview';
           const preview = document.getElementById('preview');
           const previewContent = document.getElementById('preview-content');
           preview.style.display = 'block';
           const truncated = content.length > 2000 ? content.slice(0, 2000) + '\\n... (truncated for display)' : content;
           previewContent.textContent = truncated;
       }
       
       async function copyToClipboard(text) {
           try {
               await navigator.clipboard.writeText(text);
               return true;
           } catch (err) {
               console.error('Failed to copy:', err);
               return false;
           }
       }
      
      async function runTest() {
          setStatus('Running test...');
          try {
              const result = await apiCall('test', 'POST');
              displayTestResults(result);
              
              // Copy to clipboard
              const output = result.success ? result.output : result.error;
              await copyToClipboard(output);
              
              setStatus(result.success ? 'Test completed successfully' : 'Test failed', 
                       'Output copied to clipboard');
          } catch (err) {
              setStatus('Error running test: ' + err.message);
          }
      }
      
      function displayTestResults(result) {
          const modal = document.getElementById('test-modal');
          const resultsDiv = document.getElementById('test-results');
          
          const statusClass = result.success ? 'test-success' : 'test-error';
          const statusText = result.success ? '✅ PASSED' : '❌ FAILED';
          const exitText = result.exitCode !== undefined ? ' (Exit code: ' + result.exitCode + ')' : '';
          
          let output = result.output || '';
          let errorOutput = result.error || '';
          
          resultsDiv.innerHTML = 
              '<div><strong>Command:</strong> ' + result.command + '</div>' +
              '<div><strong>Status:</strong> ' + statusText + exitText + '</div>' +
              '<div><strong>Time:</strong> ' + new Date(result.timestamp).toLocaleString() + '</div>';
          
          if (output) {
              resultsDiv.innerHTML += '<h4>Output:</h4><div class="test-output ' + statusClass + '">' + output + '</div>';
          }
          
          if (errorOutput) {
              resultsDiv.innerHTML += '<h4>Error Output:</h4><div class="test-output test-error">' + errorOutput + '</div>';
          }
          
          lastTestOutput = (output + errorOutput).trim();
          modal.classList.add('show');
      }
      
      function closeTestModal() {
          document.getElementById('test-modal').classList.remove('show');
      }
      
      async function copyTestOutput() {
          if (lastTestOutput) {
              const copied = await copyToClipboard(lastTestOutput);
              setStatus(copied ? 'Test output copied to clipboard' : 'Failed to copy test output');
          }
      }
      
      async function loadDirectoryTree() {
          try {
              const tree = await apiCall('tree');
              const treeContent = document.getElementById('directory-tree-content');
              treeContent.innerHTML = renderDirectoryTree(tree);
          } catch (err) {
              document.getElementById('directory-tree-content').innerHTML = 'Error loading tree';
          }
      }
      
      function renderDirectoryTree(items) {
          if (!items || items.length === 0) {
              return '<div class="empty-state">No files found</div>';
          }
          
          return items.map(function(item) {
              // Create proper indentation using CSS margin instead of spaces
              const indentStyle = item.level > 0 ? ' style="margin-left: ' + (item.level * 1) + 'rem;"' : '';
              
              if (item.type === 'directory') {
                  const icon = '📁';
                  const children = item.children && item.children.length > 0 ? 
                      renderDirectoryTree(item.children) : '';
                  return '<div class="tree-folder"' + indentStyle + '>' + icon + ' ' + item.name + '</div>' + children;
              } else {
                  const icon = getFileIcon(item.name);
                  let sizeInfo = '';
                  if (item.lines) {
                      // Add elephant icon for large files (> 200 lines)
                      const elephantIcon = item.lines > 200 ? '🐘 ' : '';
                      sizeInfo = ' (' + elephantIcon + item.lines + ' lines)';
                  }
                  return '<div class="tree-file"' + indentStyle + '>' + icon + ' ' + item.name + '<span class="file-size">' + sizeInfo + '</span></div>';
              }
          }).join('');
      }
      
      function getFileIcon(filename) {
          const ext = filename.split('.').pop().toLowerCase();
          const icons = {
              'js': '📄',
              'jsx': '⚛️',
              'ts': '📘',
              'tsx': '⚛️',
              'py': '🐍',
              'java': '☕',
              'cpp': '⚙️',
              'c': '⚙️',
              'h': '📋',
              'css': '🎨',
              'html': '🌐',
              'md': '📝',
              'json': '📋',
              'yml': '⚙️',
              'yaml': '⚙️',
              'xml': '📋',
              'php': '🐘',
              'rb': '💎',
              'go': '🐹',
              'rs': '🦀',
              'vue': '💚',
              'svelte': '🧡'
          };
          return icons[ext] || '📄';
      }
      
      // Initialize
      refreshStatus();
      loadSnapshots();
      loadDirectoryTree();
      loadPatchHistory();
      `;
}


module.exports = { generateJS };
