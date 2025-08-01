// Import the necessary modules
const { SnapshotManager } = require('./dashSnapshot.js');

// Check if a command-line argument is provided
if (process.argv.length < 3) {
    console.error('Usage: node cmdSnap.js <snapshot-file-basename>');
    process.exit(1);
}

// Get the file path from the command-line arguments
const snapShotName = process.argv[2];

console.log(`Restoring snapshot: ${snapShotName}`);

const snapshotManager = new SnapshotManager(".",null);

snapshotManager.restoreSnapshot( snapShotName);
