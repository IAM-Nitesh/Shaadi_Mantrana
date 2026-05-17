
import { execSync } from 'child_process';
import path from 'path';

async function globalTeardown() {
  console.log('\n🎬 Global Teardown: Starting test data cleanup...');
  try {
    // Run the backend cleanup script
    // We use execSync to run it as a separate process to ensure it uses the backend's environment
    const backendDir = path.resolve(__dirname, '../../backend');
    console.log(`📂 Backend directory: ${backendDir}`);
    
    execSync('npm run db:cleanup-test', { 
      cwd: backendDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    console.log('✅ Global Teardown: Cleanup completed successfully.');
  } catch (error) {
    console.error('❌ Global Teardown: Cleanup failed:', error);
  }
}

export default globalTeardown;
