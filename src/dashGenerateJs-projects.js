
function generateJS_PRJ() {
   
   return `
       async function extractProject() {
           setStatus('Extracting project...');
           try {
               const result = await apiCall('extract');
               const copied = await copyToClipboard(result.content);
               const statusText = copied ? 'Project extracted to clipboard!' : 'Project extracted (copy failed)';
               const statusInfo = result.fileCount + ' files extracted';
               setStatus(statusText, statusInfo);
               showPreview(result.content, 'Project Extraction');
           } catch (err) {
               setStatus('Error: ' + err.message);
           }
       }
       
       async function extractInterface() {
           setStatus('Extracting interface...');
           try {
               const result = await apiCall('extract-interface');
               const copied = await copyToClipboard(result.content);
               const statusText = copied ? 'Interface extracted to clipboard!' : 'Interface extracted (copy failed)';
               const statusInfo = result.fileCount + ' files processed';
               setStatus(statusText, statusInfo);
               showPreview(result.content, 'Interface Extraction');
           } catch (err) {
               setStatus('Error: ' + err.message);
           }
       }
       
       async function refreshStatus() {
           try {
               const status = await apiCall('status');
               const infoText = status.fileCount + ' files loaded | ' + status.snapshotCount + ' snapshots | ' + status.patchCount + ' patches';
               document.getElementById('project-info').textContent = infoText;
               
               // Also load .llmignore info
               const ignoreInfo = await apiCall('llmignore');
               const ignoreText = ignoreInfo.exists ? 
                   ignoreInfo.count + ' ignore patterns loaded' : 
                   'No .llmignore file found';
               document.getElementById('llmignore-info').textContent = ignoreText;
               
           } catch (err) {
               setStatus('Error refreshing status: ' + err.message);
           }
       }
       
       async function reloadLLMIgnore() {
           try {
               setStatus('Reloading .llmignore...');
               await apiCall('llmignore', 'POST');
               refreshStatus();
               loadDirectoryTree();
               setStatus('.llmignore reloaded successfully');
           } catch (err) {
               setStatus('Error reloading .llmignore: ' + err.message);
           }
       }
       
       async function generateProjectPrompt() {
           const projectInput = document.getElementById('project-input');
           const userInput = projectInput.value.trim();
           
           if (!userInput) {
               setStatus('Please describe the project you want to create');
               return;
           }
           
           setStatus('Generating project prompt...');
           try {
               const result = await apiCall('project-prompt', 'POST', { userInput: userInput });
               const copied = await copyToClipboard(result.prompt);
               setStatus(copied ? 'Project prompt copied to clipboard!' : 'Project prompt generated (copy failed)',
                        'Ready to paste into your LLM chat');
               showPreview(result.prompt, 'Generated Project Prompt');
           } catch (err) {
               setStatus('Error generating prompt: ' + err.message);
           }
       }
       `;
 }
module.exports = { generateJS_PRJ };
