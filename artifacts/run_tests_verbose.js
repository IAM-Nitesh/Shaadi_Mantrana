const { spawn } = require('child_process');

const child = spawn('npx', ['playwright', 'test', 'tests/playwright/features/auth_guard.feature', '--project=chromium'], {
  env: { ...process.env, DEBUG: 'pw:api' }
});
const tlog = require('../scripts/test-logger');

child.stdout.on('data', (data) => {
  tlog.info(data.toString());
});

child.stderr.on('data', (data) => {
  tlog.error(data.toString());
});

child.on('close', (code) => {
  tlog.info(`Process exited with code ${code}`);
});
