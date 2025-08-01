const fs = require('fs');
const path = require('path');

class SnapshotManager {
  constructor(projectDir, projectManager) {
    this.projectDir = projectDir;
    this.projectManager = projectManager;  // Now expects ProjectManager instead
    this.snapshotsDir = path.join(this.projectDir, '.llm-snapshots');
    this.ensureSnapshotsDir();
  }

  ensureSnapshotsDir() {
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  createSnapshot() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotName = `snapshot-${timestamp}`;
    return this._createSnapshotWithName(snapshotName);
  }

  createPatchSnapshot(patchName) {
    const snapshotName = `snapshot-pre-${patchName}`;
    return this._createSnapshotWithName(snapshotName);
  }

  _createSnapshotWithName(snapshotName) {
    const snapshotPath = path.join(this.snapshotsDir, snapshotName);
    
    const files = this.projectManager.scanProject();
    const snapshot = {
      name: snapshotName,
      timestamp: new Date().toISOString(),
      files: files,
      count: Object.keys(files).length,
      type: snapshotName.includes('-pre-p') ? 'patch' : 'manual'
    };
    
    fs.writeFileSync(snapshotPath + '.json', JSON.stringify(snapshot, null, 2));
    return snapshot;
  }

  listSnapshots() {
    const snapshots = [];
    if (fs.existsSync(this.snapshotsDir)) {
      const files = fs.readdirSync(this.snapshotsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const snapshotPath = path.join(this.snapshotsDir, file);
            const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
            snapshots.push({
              name: snapshot.name,
              timestamp: snapshot.timestamp,
              count: snapshot.count,
              type: snapshot.type || 'manual',
              filename: file
            });
          } catch (err) {
            console.warn(`Warning: Couldn't read snapshot ${file}:`, err.message);
          }
        }
      }
    }
    return snapshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  restoreSnapshot(snapshotName) {
    const snapshotPath = path.join(this.snapshotsDir, snapshotName + '.json');
    if (!fs.existsSync(snapshotPath)) {
      throw new Error('Snapshot not found');
    }
    
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
    const results = { restored: [], errors: [] };
    
    Object.entries(snapshot.files).forEach(([filePath, content]) => {
      try {
        const fullPath = path.join(this.projectDir, filePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
        results.restored.push(filePath);
      } catch (err) {
        results.errors.push({ file: filePath, error: err.message });
      }
    });
    
    return results;
  }

  // HTTP handlers for the snapshot endpoints
  handleSnapshot(req, res) {
    const snapshot = this.createSnapshot();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(snapshot));
  }

  handleListSnapshots(req, res) {
    const snapshots = this.listSnapshots();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(snapshots));
  }

  handleRestore(req, res) {
    const snapshotName = req.url.split('/').pop();
    try {
      const result = this.restoreSnapshot(snapshotName);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  }
}

module.exports = { SnapshotManager };