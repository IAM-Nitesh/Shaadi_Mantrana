/**
 * Utility script to fetch backend server logs from Render and provide Vercel instructions.
 * Since direct CLI integration depends on current active tokens, this script:
 * 1. Explains how to use the Vercel CLI to get frontend logs.
 * 2. Suggests the use of the Render MCP `list_logs` tool if within an AI agent context, 
 *    or the Render CLI/Dashboard for manual retrieval.
 */

console.log('==============================================');
console.log(' Fetching Server Logs for Debugging');
console.log('==============================================\n');

console.log('### VERCEL (Frontend) Logs ###');
console.log('To view live or recent production logs for the Next.js frontend:');
console.log('1. Ensure you have the Vercel CLI installed: `npm i -g vercel`');
console.log('2. Run the following command:');
console.log('   vercel logs shaadi-mantrana.vercel.app --prod');
console.log('   (Replace with your exact project name if different)\n');

console.log('### RENDER (Backend) Logs ###');
console.log('If you are using the AI assistant (with Render MCP configured), you can ask it to:');
console.log('   "Fetch the recent logs for the backend service using the Render MCP list_logs tool"');
console.log('');
console.log('Manually via Render Dashboard:');
console.log('1. Go to https://dashboard.render.com/');
console.log('2. Select your Web Service (Backend)');
console.log('3. Click on the "Logs" tab to view recent errors or traces.\n');

console.log('Note: To automate Render log fetching directly in this script, a Render API key is required');
console.log('via process.env.RENDER_API_KEY and making a fetch request to:');
console.log('https://api.render.com/v1/services/{serviceId}/logs');
console.log('==============================================');
