import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'my-project');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '==> Starting Pet Adoption System (Backend + Frontend)...');

const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

let isShuttingDown = false;

function cleanShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n\x1b[33m%s\x1b[0m', '==> Shutting down servers...');

  if (isWindows) {
    if (backend.pid) spawn('taskkill', ['/pid', backend.pid.toString(), '/T', '/F']);
    if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid.toString(), '/T', '/F']);
  } else {
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
  }

  process.exit(0);
}

process.on('SIGINT', cleanShutdown);
process.on('SIGTERM', cleanShutdown);

backend.on('error', (err) => {
  console.error('\x1b[31m[Backend Error]\x1b[0m', err);
});

frontend.on('error', (err) => {
  console.error('\x1b[31m[Frontend Error]\x1b[0m', err);
});

backend.on('exit', (code) => {
  if (!isShuttingDown && code !== 0) {
    console.error(`\x1b[31m[Backend exited with code ${code}]\x1b[0m`);
    cleanShutdown();
  }
});

frontend.on('exit', (code) => {
  if (!isShuttingDown && code !== 0) {
    console.error(`\x1b[31m[Frontend exited with code ${code}]\x1b[0m`);
    cleanShutdown();
  }
});

