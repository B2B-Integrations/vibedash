const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestRunner {
  constructor(projectDir) {
    this.projectDir = projectDir;
  }

  runTest() {
    const llmTestPath = path.join(this.projectDir, '.llmtest');
    
    if (!fs.existsSync(llmTestPath)) {
      throw new Error('.llmtest file not found');
    }
    
    const testCommand = fs.readFileSync(llmTestPath, 'utf8').trim();
    if (!testCommand) {
      throw new Error('.llmtest file is empty');
    }
    
    return new Promise((resolve, reject) => {
      const nodeExe = process.env.NODE_EXE || 'node';
      let output = '';
      let errorOutput = '';
      
      // Parse command - simple splitting for now
      const parts = testCommand.split(' ');
      const command = parts[0];
      const args = parts.slice(1);
      
      // Use node if command is a .js file or if NODE_EXE is specified
      const actualCommand = (command.endsWith('.js') || testCommand.startsWith('node')) ? nodeExe : command;
      const actualArgs = command.endsWith('.js') ? [command, ...args] : 
                        testCommand.startsWith('node') ? args : 
                        [command, ...args].slice(1);
      
      const child = spawn(actualCommand, actualArgs, { 
        cwd: this.projectDir,
        stdio: 'pipe',
        shell: true
      });
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      child.on('close', (code) => {
        const result = {
          command: testCommand,
          exitCode: code,
          output: output,
          error: errorOutput,
          success: code === 0,
          timestamp: new Date().toISOString()
        };
        
        resolve(result);
      });
      
      child.on('error', (err) => {
        reject({
          error: 'Failed to run test: ' + err.message,
          command: testCommand
        });
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          reject({
            error: 'Test command timed out after 30 seconds',
            command: testCommand,
            partialOutput: output,
            partialError: errorOutput
          });
        }
      }, 30000);
    });
  }

  // HTTP handler for the test endpoint
  async handleTest(req, res) {
    try {
      const result = await this.runTest();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (error.error && error.error.includes('.llmtest file')) {
        statusCode = 400;
      } else if (error.error && error.error.includes('timed out')) {
        statusCode = 408;
      }
      
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(error));
    }
  }
}

module.exports = { TestRunner };