const fs = require('fs');
const path = require('path');

class PatchHistoryManager {
  constructor(projectDir, snapshotManager) {
    this.projectDir = projectDir;
    this.snapshotManager = snapshotManager;
    this.historyDir = path.join(this.projectDir, '.llm-patches');
    this.ensureHistoryDir();
  }

  ensureHistoryDir() {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
  }

  getNextPatchNumber() {
    const patches = this.listPatches();
    let maxNumber = 0;
    
    for (const patch of patches) {
      const match = patch.name.match(/^p(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    return maxNumber + 1;
  }

  savePatch(patchContent, result) {
    const patchNumber = this.getNextPatchNumber();
    const patchName = `p${patchNumber}`;
    const patchPath = path.join(this.historyDir, patchName);
    
    // Create snapshot BEFORE applying patch
    let snapshotResult = null;
    try {
      snapshotResult = this.snapshotManager.createPatchSnapshot(patchName);
      console.log(`[PatchHistory] Created snapshot: ${snapshotResult.name}`);
    } catch (err) {
      console.warn(`[PatchHistory] Failed to create snapshot: ${err.message}`);
    }
    
    const patchRecord = {
      name: patchName,
      number: patchNumber,
      timestamp: new Date().toISOString(),
      patch: patchContent,
      result: result,
      snapshot: snapshotResult ? snapshotResult.name : null,
      files: result.applied ? result.applied.length : 0,
      errors: result.errors ? result.errors.length : 0,
      success: result.errors ? result.errors.length === 0 : true
    };
    
    try {
      fs.writeFileSync(patchPath + '.json', JSON.stringify(patchRecord, null, 2));
      console.log(`[PatchHistory] Saved patch: ${patchName} with snapshot: ${snapshotResult ? snapshotResult.name : 'none'}`);
      return patchRecord;
    } catch (err) {
      console.warn(`[PatchHistory] Failed to save patch: ${err.message}`);
      return null;
    }
  }

  listPatches() {
    const patches = [];
    if (fs.existsSync(this.historyDir)) {
      try {
        const files = fs.readdirSync(this.historyDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const patchPath = path.join(this.historyDir, file);
              const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
              patches.push({
                name: patch.name,
                number: patch.number || 0,
                timestamp: patch.timestamp,
                files: patch.files,
                errors: patch.errors,
                success: patch.success,
                snapshot: patch.snapshot || patch.backup, // Support old backup field for compatibility
                filename: file
              });
            } catch (err) {
              console.warn(`Warning: Couldn't read patch ${file}:`, err.message);
            }
          }
        }
      } catch (err) {
        console.warn(`Warning: Couldn't read patches directory:`, err.message);
      }
    }
    
    // Sort by patch number, newest first
    return patches.sort((a, b) => b.number - a.number);
  }

  getPatch(patchName) {
    const patchPath = path.join(this.historyDir, patchName + '.json');
    if (fs.existsSync(patchPath)) {
      try {
        return JSON.parse(fs.readFileSync(patchPath, 'utf8'));
      } catch (err) {
        console.warn(`Warning: Couldn't read patch ${patchName}:`, err.message);
        return null;
      }
    }
    return null;
  }

  clearHistory() {
    if (fs.existsSync(this.historyDir)) {
      try {
        const files = fs.readdirSync(this.historyDir);
        let deletedCount = 0;
        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(this.historyDir, file));
            deletedCount++;
          }
        }
        console.log(`[PatchHistory] Cleared ${deletedCount} patches`);
        return { deletedCount };
      } catch (err) {
        console.warn(`Warning: Error clearing patch history:`, err.message);
        throw err;
      }
    }
    return { deletedCount: 0 };
  }

  // HTTP handlers for patch history endpoints
  handleList(req, res) {
    const patches = this.listPatches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(patches));
  }

  handleGet(req, res) {
    const patchName = req.url.split('/').pop();
    const patch = this.getPatch(patchName);
    if (patch) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(patch));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Patch not found' }));
    }
  }

  handleClear(req, res) {
    try {
      const result = this.clearHistory();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  }
}

module.exports = { PatchHistoryManager };