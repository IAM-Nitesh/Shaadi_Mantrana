const { spawn } = require('child_process');

const child = spawn('npx', ['playwright', 'test', 'tests/playwright/features/auth_guard.feature', '--project=chromium'], {
  env: { ...process.env, DEBUG: 'pw:api' }
});

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});
