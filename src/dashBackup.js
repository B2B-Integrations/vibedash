const fs = require('fs');
const path = require('path');

class BackupManager {
  constructor(projectDir, projectManager) {
    this.projectDir = projectDir;
    this.projectManager = projectManager;  // Now expects ProjectManager instead
    this.backupsDir = path.join(this.projectDir, '.llm-backups');
    this.ensureBackupsDir();
  }

  ensureBackupsDir() {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    return this._createBackupWithName(backupName);
  }

  createPatchBackup(patchName) {
    const backupName = `backup-${patchName}`;
    return this._createBackupWithName(backupName);
  }

  _createBackupWithName(backupName) {
    const backupPath = path.join(this.backupsDir, backupName);
    
    const files = this.projectManager.scanProject();
    const backup = {
      name: backupName,
      timestamp: new Date().toISOString(),
      files: files,
      count: Object.keys(files).length,
      type: backupName.includes('-p') ? 'patch' : 'manual'
    };
    
    fs.writeFileSync(backupPath + '.json', JSON.stringify(backup, null, 2));
    return backup;
  }

  listBackups() {
    const backups = [];
    if (fs.existsSync(this.backupsDir)) {
      const files = fs.readdirSync(this.backupsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const backupPath = path.join(this.backupsDir, file);
            const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            backups.push({
              name: backup.name,
              timestamp: backup.timestamp,
              count: backup.count,
              type: backup.type || 'manual',
              filename: file
            });
          } catch (err) {
            console.warn(`Warning: Couldn't read backup ${file}:`, err.message);
          }
        }
      }
    }
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  restoreBackup(backupName) {
    const backupPath = path.join(this.backupsDir, backupName + '.json');
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup not found');
    }
    
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const results = { restored: [], errors: [] };
    
    Object.entries(backup.files).forEach(([filePath, content]) => {
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

  // HTTP handlers for the backup endpoints
  handleBackup(req, res) {
    const backup = this.createBackup();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(backup));
  }

  handleListBackups(req, res) {
    const backups = this.listBackups();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(backups));
  }

  handleRestore(req, res) {
    const backupName = req.url.split('/').pop();
    try {
      const result = this.restoreBackup(backupName);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  }
}

module.exports = { BackupManager };