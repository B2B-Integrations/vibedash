function generateJS_SNAP() {
   
   return `
       
       async function createSnapshot() {
           setStatus('Creating snapshot...');
           try {
               const result = await apiCall('snapshot', 'POST');
               const statusInfo = result.count + ' files captured';
               setStatus('Snapshot created: ' + result.name, statusInfo);
               loadSnapshots();
           } catch (err) {
               setStatus('Error: ' + err.message);
           }
       }
       
       async function loadSnapshots() {
           try {
               const snapshots = await apiCall('snapshots');
               const snapshotsList = document.getElementById('snapshots-list');
               
               if (snapshots.length === 0) {
                   snapshotsList.innerHTML = '<div class="empty-state">No snapshots yet</div>';
                   return;
               }
               
               const snapshotItems = snapshots.map(function(snapshot) {
                   const date = new Date(snapshot.timestamp);
                   const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                   const dateStr = date.toLocaleDateString();
                   
                   // Different icons for different snapshot types
                   const icon = snapshot.type === 'patch' ? '🔧' : '📸';
                   const typeLabel = snapshot.type === 'patch' ? ' (pre-patch)' : '';
                   
                   // Clean up the display name by removing "snapshot-" prefix
                   let displayName = snapshot.name.replace('snapshot-', '');
                   if (displayName.startsWith('pre-')) {
                       displayName = displayName.replace('pre-', 'pre-');  // Keep pre- prefix for clarity
                   }
                   
                   return '<div class="list-item">' +
                       '<span class="item-main">' + icon + ' ' + displayName + typeLabel + '</span>' +
                       '<span class="item-meta">' + dateStr + ' ' + timeStr + ' • ' + snapshot.count + ' files</span>' +
                       '<a class="item-link" onclick="restoreSnapshot(&quot;' + snapshot.name + '&quot;)" href="javascript:void(0)">restore</a>' +
                       '</div>';
               });
               snapshotsList.innerHTML = snapshotItems.join('\\n');
           } catch (err) {
               setStatus('Error loading snapshots: ' + err.message);
           }
       }
       
       async function restoreSnapshot(snapshotName) {
           const confirmMsg = 'Restore snapshot "' + snapshotName + '"? This will overwrite current files.';
           if (!confirm(confirmMsg)) return;
           
           setStatus('Restoring snapshot...');
           try {
               const result = await apiCall('restore/' + snapshotName, 'POST');
               const statusText = 'Snapshot restored: ' + result.restored.length + ' files restored';
               const statusInfo = result.errors.length ? result.errors.length + ' errors' : '';
               setStatus(statusText, statusInfo);
               refreshStatus();
               loadDirectoryTree();
           } catch (err) {
               setStatus('Error: ' + err.message);
           }
       }
       `;
 }
module.exports = { generateJS_SNAP };