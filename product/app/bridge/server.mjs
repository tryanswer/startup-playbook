#!/usr/bin/env node

import { WebSocketServer } from 'ws';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const PORT = 3001;
const ALLOWED_ORIGIN = 'http://localhost:3000';

// Session management
const sessions = new Map();

// Check if CLI tools are available
async function checkCLIAvailability() {
  const tools = {};
  
  try {
    await execAsync('which codex');
    tools.codex = true;
    console.log('✓ codex CLI found');
  } catch {
    tools.codex = false;
    console.log('✗ codex CLI not found');
  }
  
  try {
    await execAsync('which claude');
    tools.claude = true;
    console.log('✓ claude CLI found');
  } catch {
    tools.claude = false;
    console.log('✗ claude CLI not found');
  }
  
  return tools;
}

// Create a session for a WebSocket connection
function createSession(ws, command, args = [], cwd = process.cwd()) {
  const sessionId = Date.now().toString();
  
  let spawnCommand;
  let spawnArgs = [];
  
  // For codex and claude, wrap with script to simulate TTY (macOS)
  if (command === 'codex' || command === 'claude') {
    spawnCommand = 'script';
    spawnArgs = ['-q', '/dev/null', command, ...args];
  } else if (command === 'shell') {
    spawnCommand = 'zsh';
    spawnArgs = ['-i'];
  } else {
    spawnCommand = command;
    spawnArgs = args;
  }
  
  console.log(`Spawning: ${spawnCommand} ${spawnArgs.join(' ')} in ${cwd}`);
  
  const proc = spawn(spawnCommand, spawnArgs, {
    cwd,
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, TERM: 'xterm-256color' },
  });
  
  const session = {
    id: sessionId,
    proc,
    ws,
  };
  
  sessions.set(sessionId, session);
  
  // Handle stdout
  proc.stdout.on('data', (data) => {
    const output = data.toString();
    ws.send(JSON.stringify({ type: 'output', data: output }));
  });
  
  // Handle stderr
  proc.stderr.on('data', (data) => {
    const output = data.toString();
    ws.send(JSON.stringify({ type: 'output', data: output }));
  });
  
  // Handle exit
  proc.on('exit', (code) => {
    ws.send(JSON.stringify({ type: 'exit', code: code ?? 0 }));
    sessions.delete(sessionId);
    console.log(`Session ${sessionId} exited with code ${code}`);
  });
  
  // Handle errors
  proc.on('error', (err) => {
    ws.send(JSON.stringify({ type: 'error', message: err.message }));
    sessions.delete(sessionId);
    console.error(`Session ${sessionId} error:`, err.message);
  });
  
  return sessionId;
}

// Start WebSocket server
async function startServer() {
  const availableTools = await checkCLIAvailability();
  
  const wss = new WebSocketServer({ 
    port: PORT,
    perMessageDeflate: false,
  });
  
  console.log(`Bridge server listening on ws://localhost:${PORT}`);
  console.log(`Available tools: ${Object.entries(availableTools).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'none'}`);
  
  wss.on('connection', (ws, req) => {
    const origin = req.headers.origin;
    
    // CORS check
    if (origin && origin !== ALLOWED_ORIGIN && !origin.startsWith('http://localhost:')) {
      console.log(`Rejected connection from ${origin}`);
      ws.close(1008, 'Origin not allowed');
      return;
    }
    
    console.log('Client connected');
    
    let currentSessionId = null;
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'spawn': {
            // Kill existing session if any
            if (currentSessionId && sessions.has(currentSessionId)) {
              const oldSession = sessions.get(currentSessionId);
              oldSession.proc.kill();
              sessions.delete(currentSessionId);
            }
            
            const { command, args = [], cwd = process.cwd() } = data;
            
            // Validate command
            if (command === 'codex' && !availableTools.codex) {
              ws.send(JSON.stringify({ type: 'error', message: 'codex CLI not installed. Run: npm install -g @openai/codex' }));
              return;
            }
            
            if (command === 'claude' && !availableTools.claude) {
              ws.send(JSON.stringify({ type: 'error', message: 'claude CLI not installed. Install Claude Code CLI first.' }));
              return;
            }
            
            currentSessionId = createSession(ws, command, args, cwd);
            break;
          }
          
          case 'input': {
            if (currentSessionId && sessions.has(currentSessionId)) {
              const session = sessions.get(currentSessionId);
              session.proc.stdin.write(data.data);
            }
            break;
          }
          
          case 'resize': {
            // Note: With script wrapper, resize is not directly supported
            // Could implement pty resizing if needed
            console.log(`Resize request: ${data.cols}x${data.rows} (not implemented with script wrapper)`);
            break;
          }
          
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (err) {
        console.error('Error processing message:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected');
      
      // Kill associated process
      if (currentSessionId && sessions.has(currentSessionId)) {
        const session = sessions.get(currentSessionId);
        session.proc.kill();
        sessions.delete(currentSessionId);
      }
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
