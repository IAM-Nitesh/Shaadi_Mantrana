const reactEmailService = require('../src/services/reactEmailService');

async function testEmailRendering() {
  console.log('🧪 Testing Email Rendering (Regression Test for JSX Parse Error)...');
  try {
    const html = await reactEmailService.renderWelcomeEmail(
      'test@example.com',
      'http://localhost:3000/invite',
      'test-uuid'
    );
    if (html.includes('Shaadi Mantrana')) {
      console.log('✅ Success: Email rendered correctly with JSX components.');
      process.exit(0);
    } else {
      console.error('❌ Failure: Email rendered but missing expected content.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failure: Email rendering crashed!');
    console.error(error);
    process.exit(1);
  }
}

testEmailRendering();
