const { spawn } = require('child_process');

const web = spawn('npm', ['run', 'dev'], {
  cwd: './apps/web',
  stdio: 'inherit',
  shell: true,
});

web.on('error', err => {
  console.error('Failed to start web server:', err);
  process.exit(1);
});

web.on('close', code => {
  console.log(`Web server exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\nShutting down web server...');
  web.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down web server...');
  web.kill('SIGTERM');
});
