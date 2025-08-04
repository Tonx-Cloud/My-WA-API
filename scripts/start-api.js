const { spawn } = require('child_process');

const api = spawn('node_modules/.bin/tsx', ['watch', 'src/index.ts'], {
  cwd: './apps/api',
  stdio: 'inherit',
});

api.on('error', err => {
  console.error('Failed to start API server:', err);
  process.exit(1);
});

api.on('close', code => {
  console.log(`API server exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\nShutting down API server...');
  api.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down API server...');
  api.kill('SIGTERM');
});
