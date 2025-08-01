function generateJS_PATCH() {
   
   return `

       let patchHistory = [];
       let currentPatchContent = '';
       
       // Robust patch/request parser and validator
       function parseAndValidateInput(input) {
           const lines = input.split('\\n');
           let result = {
               type: 'unknown',
               valid: false,
               errors: [],
               data: null
           };
           
           let nestingLevel = 0;
           let mode = null;
           let modeSetAt = -1;
           let currentFile = null;
           let currentContent = [];
           let files = {};
           let requestFiles = [];
           
           console.log('[Validator] Starting validation of', lines.length, 'lines');
           console.log('[Validator] First 3 lines:', lines.slice(0, 3));
           
           for (let i = 0; i < lines.length; i++) {
               const line = lines[i];
               const trimmed = line.trim();
               
               console.log('[Validator] Processing line', i+1 + ':', JSON.stringify(line));
               console.log('[Validator]   - Trimmed:', JSON.stringify(trimmed));
               console.log('[Validator]   - Current state: nesting=' + nestingLevel + ', mode=' + mode);
               
               // Skip empty lines but preserve them in file content
               if (trimmed.length === 0) {
                   console.log('[Validator]   - Empty line, skipping (but preserving in content if in file)');
                   if (nestingLevel > 0 && mode === 'patch') {
                       currentContent.push(line);
                   }
                   continue;
               }
               
               // Check if this is a mode command (highest priority)
               if (trimmed === '=== PATCH ===') {
                   console.log('[Validator]   - Found PATCH command');
                   if (mode !== null) {
                       result.errors.push('Mode already set to "' + mode + '" at line ' + (modeSetAt+1) + ', cannot change to "patch" at line ' + (i+1));
                       return result;
                   }
                   mode = 'patch';
                   modeSetAt = i;
                   console.log('[Validator]   - Set mode to PATCH');
                   continue;
               }
               
               if (trimmed === '=== REQUEST ===') {
                   console.log('[Validator]   - Found REQUEST command');
                   if (mode !== null) {
                       result.errors.push('Mode already set to "' + mode + '" at line ' + (modeSetAt+1) + ', cannot change to "request" at line ' + (i+1));
                       return result;
                   }
                   mode = 'request';
                   modeSetAt = i;
                   console.log('[Validator]   - Set mode to REQUEST');
                   continue;
               }
               
               // Check for ENDFILE marker
               if (trimmed === '--- ENDFILE ---') {
                   console.log('[Validator]   - Found ENDFILE marker');
                   if (nestingLevel === 0) {
                       result.errors.push('Found ENDFILE without matching FILE at line ' + (i+1));
                       continue;
                   }
                   nestingLevel = 0;
                   
                   // Save current file
                   if (currentFile && mode === 'patch') {
                       files[currentFile] = currentContent.join('\\n');
                       console.log('[Validator]   - Saved file:', currentFile, '(' + currentContent.length + ' lines)');
                   }
                   currentFile = null;
                   currentContent = [];
                   continue;
               }
               
               // Check for FILE markers
               if (trimmed.startsWith('--- FILE:') && trimmed.endsWith(' ---')) {
                   console.log('[Validator]   - Found FILE marker');
                   if (nestingLevel > 0) {
                       result.errors.push('Found nested FILE marker at line ' + (i+1));
                       continue;
                   }
                   
                   // Extract filename
                   const fileMatch = trimmed.match(/^--- FILE: (.+) ---$/);
                   if (fileMatch) {
                       // Save previous file if exists
                       if (currentFile && mode === 'patch') {
                           files[currentFile] = currentContent.join('\\n');
                           console.log('[Validator]   - Saved previous file:', currentFile);
                       }
                       
                       currentFile = fileMatch[1].trim();
                       currentContent = [];
                       nestingLevel = 1;
                       console.log('[Validator]   - Started new file:', currentFile);
                   } else {
                       result.errors.push('Invalid FILE marker format at line ' + (i+1) + ': ' + trimmed);
                   }
                   continue;
               }
               
               // Check for REQUEST_FILES
               if (trimmed.startsWith('REQUEST_FILES:')) {
                   console.log('[Validator]   - Found REQUEST_FILES');
                   if (mode !== 'request') {
                       if (mode === null) {
                           result.errors.push('Found REQUEST_FILES without "=== REQUEST ===" declaration at line ' + (i+1));
                       } else {
                           result.errors.push('Found REQUEST_FILES in "' + mode + '" mode at line ' + (i+1));
                       }
                       return result;
                   }
                   
                   const fileList = trimmed.replace('REQUEST_FILES:', '').trim();
                   if (!fileList) {
                       result.errors.push('Empty REQUEST_FILES at line ' + (i+1));
                       return result;
                   }
                   
                   const parsedFiles = fileList.split(',').map(f => f.trim()).filter(f => f.length > 0);
                   if (parsedFiles.length === 0) {
                       result.errors.push('No valid files in REQUEST_FILES at line ' + (i+1));
                       return result;
                   }
                   
                   requestFiles = parsedFiles;
                   console.log('[Validator]   - Parsed REQUEST_FILES:', parsedFiles);
                   continue;
               }
               
               // If we reach here, it's content
               console.log('[Validator]   - Processing as content');
               
               if (nestingLevel > 0) {
                   // Inside a file - add to content
                   console.log('[Validator]   - Adding to file content');
                   if (mode === 'patch') {
                       currentContent.push(line);
                       
                       // Warn about command-like patterns inside files
                       if (trimmed === '=== PATCH ===' || trimmed === '=== REQUEST ===' || trimmed.startsWith('REQUEST_FILES:')) {
                           console.log('[Validator]   - WARNING: Command-like pattern inside file:', trimmed);
                       }
                   }
               } else {
                   // Outside a file
                   if (mode === null) {
                       console.log('[Validator]   - ERROR: Content without mode declaration');
                       result.errors.push('Content found without mode declaration at line ' + (i+1) + ': ' + trimmed.substring(0, 50) + (trimmed.length > 50 ? '...' : ''));
                       return result;
                   } else {
                       console.log('[Validator]   - Content outside file in mode:', mode);
                       // In patch mode, content outside files is unusual but not necessarily an error
                       // In request mode, content outside REQUEST_FILES is unusual
                   }
               }
           }
           
           // Handle final file if no ENDFILE marker
           if (currentFile && mode === 'patch' && nestingLevel > 0) {
               files[currentFile] = currentContent.join('\\n');
               console.log('[Validator] Saved final file:', currentFile, '(no ENDFILE marker)');
           }
           
           // Final validation
           console.log('[Validator] Final validation - mode:', mode);
           
           if (mode === null) {
               result.errors.push('No mode specified. Use "=== PATCH ===" or "=== REQUEST ==="');
               return result;
           }
           
           if (mode === 'patch') {
               console.log('[Validator] Found', Object.keys(files).length, 'files:', Object.keys(files));
               if (Object.keys(files).length === 0) {
                   result.errors.push('PATCH mode specified but no files found');
                   return result;
               }
               result.type = 'patch';
               result.data = { files: files };
           } else if (mode === 'request') {
               console.log('[Validator] Found', requestFiles.length, 'request files:', requestFiles);
               if (requestFiles.length === 0) {
                   result.errors.push('REQUEST mode specified but no REQUEST_FILES found');
                   return result;
               }
               result.type = 'request';
               result.data = { files: requestFiles };
           }
           
           result.valid = true;
           console.log('[Validator] Validation successful!');
           return result;
       }
       
       async function loadPatchHistory() {
           try {
               patchHistory = await apiCall('patches');
               updatePatchHistoryDisplay();
           } catch (err) {
               console.error('Error loading patch history:', err);
               document.getElementById('patch-history-content').textContent = 'Error loading patch history';
           }
       }
       
       function updatePatchHistoryDisplay() {
           const historyContent = document.getElementById('patch-history-content');
           
           if (patchHistory.length === 0) {
               historyContent.innerHTML = '<div class="empty-state">No patches applied yet</div>';
               return;
           }
           
           const historyItems = patchHistory.map(function(item, index) {
               const date = new Date(item.timestamp);
               const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
               const dateStr = date.toLocaleDateString();
               const status = item.success ? '✓' : '✗';
               const statusColor = item.success ? '#10b981' : '#ef4444';
               const patchNumber = item.name || 'p' + (item.number || (index + 1));
               
               return '<div class="list-item">' +
                   '<span class="item-main" style="color: ' + statusColor + '">' + status + ' ' + patchNumber + '</span>' +
                   '<span class="item-meta">' + dateStr + ' ' + timeStr + ' • ' + item.files + ' files • ' + item.errors + ' errors</span>' +
                   '<a class="item-link" onclick="showPatchDetails(\\''+item.name+'\\')" href="javascript:void(0)">view</a>' +
                   '</div>';
           });
           
           historyContent.innerHTML = historyItems.join('');
       }
       
       async function showPatchDetails(patchName) {
           try {
               const item = await apiCall('patch/' + patchName);
               const modal = document.getElementById('patch-modal');
               const details = document.getElementById('patch-details');
               
               const date = new Date(item.timestamp);
               const fullDate = date.toLocaleString();
               const status = item.success ? '✅ SUCCESS' : '❌ FAILED';
               
               let resultDetails = '';
               if (item.result.applied && item.result.applied.length > 0) {
                   resultDetails += '<div><strong>Files Applied:</strong> ' + item.result.applied.join(', ') + '</div>';
               }
               if (item.result.errors && item.result.errors.length > 0) {
                   resultDetails += '<div><strong>Errors:</strong></div>';
                   item.result.errors.forEach(function(error) {
                       resultDetails += '<div style="color: #ef4444; font-size: 0.875rem; margin-left: 1rem;">' + 
                           error.file + ': ' + error.error + '</div>';
                   });
               }
               
               let snapshotInfo = '';
               if (item.snapshot) {
                   snapshotInfo = '<div><strong>Snapshot Created:</strong> ' + item.snapshot + '</div>';
               }
               
               details.innerHTML = 
                   '<div><strong>Patch:</strong> ' + item.name + '</div>' +
                   '<div><strong>Applied:</strong> ' + fullDate + '</div>' +
                   '<div><strong>Status:</strong> ' + status + '</div>' +
                   '<div><strong>Files Changed:</strong> ' + item.files + '</div>' +
                   '<div><strong>Errors:</strong> ' + item.errors + '</div>' +
                   snapshotInfo +
                   resultDetails +
                   '<h4 style="margin-top: 1rem;">Patch Content:</h4>' +
                   '<div class="test-output" style="max-height: 30rem;">' + item.patch + '</div>';
               
               currentPatchContent = item.patch;
               modal.classList.add('show');
           } catch (err) {
               setStatus('Error loading patch details: ' + err.message);
           }
       }
       
       function closePatchModal() {
           document.getElementById('patch-modal').classList.remove('show');
       }
       
       async function copyPatchContent() {
           if(currentPatchContent) {
              const copied = await copyToClipboard(currentPatchContent);
              setStatus(copied ? 'Patch content copied to clipboard' : 'Failed to copy patch content');
          }
      }
      
      async function clearPatchHistory() {
          if (confirm('Clear all patch history? This cannot be undone.')) {
              try {
                  const result = await apiCall('clear-patches', 'POST');
                  await loadPatchHistory();
                  setStatus('Patch history cleared: ' + result.deletedCount + ' patches removed');
                  refreshStatus();
              } catch (err) {
                  setStatus('Error clearing patch history: ' + err.message);
              }
          }
      }
      
      async function applyPatch() {
          const patchInput = document.getElementById('patch-input');
          const input = patchInput.value.trim();
          
          if (!input) {
              setStatus('No input provided');
              return;
          }
          
          setStatus('Validating input...');
          console.log('[Client] Starting validation of input:', input.substring(0, 100) + '...');
          
          // Parse and validate the input
          const validation = parseAndValidateInput(input);
          
          if (!validation.valid) {
              const errorMsg = 'Validation failed:\\n' + validation.errors.join('\\n');
              setStatus('❌ Validation Error', validation.errors.length + ' error(s) found');
              
              console.log('[Client] Validation failed:', validation.errors);
              
              // Copy errors to clipboard
              await copyToClipboard(errorMsg);
              
              // Show preview of errors
              showPreview(errorMsg, 'Validation Errors');
              return;
          }
          
          console.log('[Client] Validated', validation.type, 'with data:', validation.data);
          setStatus('✅ Validation passed, processing ' + validation.type + '...');
          
          try {
              if (validation.type === 'request') {
                  const result = await apiCall('request', 'POST', { files: validation.data.files });
                  const copied = await copyToClipboard(result.response);
                  const statusText = copied ? 'Request response copied to clipboard!' : 'Request processed (copy failed)';
                  const statusInfo = result.found.length + ' found, ' + result.notFound.length + ' not found';
                  setStatus(statusText, statusInfo);
                  showPreview(result.response, 'Request Response');
              } else if (validation.type === 'patch') {
                  // Send the parsed structure instead of raw patch text
                  console.log('[Client] Sending parsed patch data to server:', validation.data);
                  const payload = {
                      type: 'parsed',
                      files: validation.data.files,
                      originalPatch: input  // Keep original for history
                  };
                  
                  const result = await apiCall('patch', 'POST', payload);
                  console.log('[Client] Server response:', result);
                  
                  // Handle both old and new response formats
                  const appliedCount = result.applied ? result.applied.length : 0;
                  const errorsCount = result.errors ? result.errors.length : 0;
                  
                  const statusText = 'Patch applied: ' + appliedCount + ' files updated';
                  const statusInfo = errorsCount ? errorsCount + ' errors' : '';
                  setStatus(statusText, statusInfo);
                  
                  // Reload patch history and snapshots from server
                  await loadPatchHistory();
                  await loadSnapshots();
                  
                  patchInput.value = '';
                  refreshStatus();
                  loadDirectoryTree();
              }
          } catch (err) {
              setStatus('❌ Processing Error: ' + err.message);
              await copyToClipboard('Processing Error: ' + err.message);
          }
      }
      
      `;
}


module.exports = { generateJS_PATCH };